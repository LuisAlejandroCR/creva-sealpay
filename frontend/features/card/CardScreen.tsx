// CardScreen.tsx: mobile port of creva_finance's app/cards/page.tsx (+ the cards/[id] limit and
// freeze controls, folded in — one card, no need for a separate detail route). Real cards.list /
// cards.get / cards.freeze/unfreeze / transactions.list / kyc.status; no mock card.
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cards, isBackendUnlinked, kyc, transactions, type Transaction } from "../../lib/api";
import { formatDayWithYear } from "../../lib/format-date";
import { formatMoney } from "../../lib/format-money";
import { BackButton } from "../shared/BackButton";
import { BackendPendingState } from "../shared/BackendPendingState";
import { Card, Section } from "../query/components/VisualPrimitives";
import { VirtualCard } from "./VirtualCard";

export interface CardScreenProps {
  onBack: () => void;
  onOpenCreate: () => void;
  onOpenKyc: () => void;
}

type UserCard = { id: string; maskedIdentifier: string; status: string };

export function CardScreen({ onBack, onOpenCreate, onOpenKyc }: CardScreenProps) {
  const [cardReady, setCardReady] = useState<boolean | null>(null);
  const [kycDone, setKycDone] = useState<boolean | null>(null);
  const [userCard, setUserCard] = useState<UserCard | null>(null);
  const [spendingLimit, setSpendingLimit] = useState<string | null>(null);
  const [txList, setTxList] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backendPending, setBackendPending] = useState(false);
  // GET /cards (cards.list) is not exposed by the core yet — the reference frontend hits the same
  // 404 and quietly falls back to "no card". A list failure that isn't an unlinked-account 401
  // (handled by backendPending) is surfaced as its own honest state, not as "you have no cards".
  // See docs/plan.md.
  const [listFailed, setListFailed] = useState(false);

  useEffect(() => {
    kyc
      .status()
      .then((result) => setKycDone(result.kyc?.status === "approved"))
      .catch((err) => {
        if (isBackendUnlinked(err)) setBackendPending(true);
        setKycDone(false);
      });

    cards
      .list()
      .then(async (list) => {
        if (list.length > 0) {
          setUserCard(list[0]);
          setIsFrozen(list[0].status === "frozen");
          setCardReady(true);
          try {
            const detail = await cards.get(list[0].id);
            setSpendingLimit(detail.spendingLimit);
          } catch {
            /* limit stays unknown */
          }
        } else {
          setCardReady(false);
        }
      })
      .catch((err) => {
        if (isBackendUnlinked(err)) setBackendPending(true);
        else setListFailed(true);
        setCardReady(false);
      });
  }, []);

  const loadTransactions = useCallback(() => {
    transactions
      .list({ limit: 20 })
      .then(setTxList)
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function handleFreezeToggle() {
    if (!userCard) return;
    setFreezeLoading(true);
    setErrorMsg(null);
    try {
      if (isFrozen) await cards.unfreeze(userCard.id);
      else await cards.freeze(userCard.id);
      setIsFrozen((prev) => !prev);
    } catch {
      setErrorMsg(isFrozen ? "No se pudo descongelar la tarjeta" : "No se pudo congelar la tarjeta");
    } finally {
      setFreezeLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="card-screen">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Mis tarjetas</Text>

        {backendPending ? (
          <BackendPendingState />
        ) : cardReady === null || kycDone === null ? (
          <View className="items-center py-10" testID="card-loading">
            <ActivityIndicator />
          </View>
        ) : listFailed ? (
          <Section>
            <Card testID="card-list-unavailable">
              <View className="items-start gap-3">
                <Text className="text-base font-bold text-text">No pudimos consultar tus tarjetas</Text>
                <Text className="text-sm leading-5 text-text/70">
                  El servicio de tarjetas no respondió. Vuelve a intentarlo más tarde; no quiere
                  decir que no tengas una tarjeta.
                </Text>
              </View>
            </Card>
          </Section>
        ) : !cardReady ? (
          <Section>
            <Card testID="card-empty">
              <View className="items-start gap-3">
                <Text className="text-base font-bold text-text">Sin tarjetas aún</Text>
                <Text className="text-sm leading-5 text-text/70">
                  {kycDone
                    ? "Crea tu primera tarjeta virtual Creva respaldada por tu garantía."
                    : "Completa la verificación de identidad para activar tu tarjeta Creva."}
                </Text>
                <Pressable
                  className="rounded-xl bg-crimson px-5 py-3"
                  onPress={kycDone ? onOpenCreate : onOpenKyc}
                  testID="card-empty-cta"
                >
                  <Text className="text-center font-semibold text-white">
                    {kycDone ? "Crear mi primera tarjeta" : "Completar KYC"}
                  </Text>
                </Pressable>
              </View>
            </Card>
          </Section>
        ) : (
          <View className="mt-6 gap-6">
            <VirtualCard masked={userCard?.maskedIdentifier ?? "••••"} frozen={isFrozen} />

            {errorMsg ? <Text className="text-sm text-crimson">{errorMsg}</Text> : null}

            <View className="flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-border bg-surface-1 p-4">
                <Text className="text-xs font-semibold uppercase text-text/50">Límite disponible</Text>
                <Text className="mt-1 text-lg font-bold text-text">
                  {spendingLimit ? formatMoney(spendingLimit) || "—" : "—"}
                </Text>
                <Text className="mt-1 text-[11px] leading-4 text-text/40">
                  El emisor reporta el límite, no lo gastado.
                </Text>
              </View>
              <Pressable
                className="flex-1 items-center justify-center rounded-2xl border border-border bg-surface-1 p-4"
                onPress={handleFreezeToggle}
                disabled={freezeLoading}
                testID="card-freeze-toggle"
              >
                {freezeLoading ? (
                  <ActivityIndicator />
                ) : (
                  <Text className={`text-sm font-semibold ${isFrozen ? "text-crimson" : "text-text"}`}>
                    {isFrozen ? "Descongelar" : "Congelar"}
                  </Text>
                )}
              </Pressable>
            </View>

            <Section
              title="Movimientos recientes"
              lead={`${txList.length} ${txList.length === 1 ? "movimiento" : "movimientos"}`}
            >
              {txLoading ? (
                <View className="items-center py-4">
                  <ActivityIndicator />
                </View>
              ) : txList.length === 0 ? (
                <Text className="text-sm text-text/60">Todavía no hay movimientos en esta tarjeta.</Text>
              ) : (
                <View>
                  {txList.map((tx) => (
                    <View
                      key={tx.id}
                      className="flex-row items-center justify-between border-b border-text/5 py-3"
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-sm font-semibold text-text">{tx.merchantName}</Text>
                        <Text className="text-xs text-text/50">
                          {formatDayWithYear(tx.occurredAt)} ·{" "}
                          {tx.businessClassification === "business" ? "Negocio" : "Personal"}
                        </Text>
                      </View>
                      <Text
                        className={`text-sm font-bold ${
                          tx.transactionType === "charge" ? "text-crimson" : "text-success"
                        }`}
                      >
                        {tx.transactionType === "charge" ? "-" : "+"}
                        {formatMoney(tx.amount) || "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Section>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
