// FiscalInfoScreen.tsx: mobile port of creva_finance's app/profile/fiscal/page.tsx — RFC, razón
// social, régimen, estado, CP y dirección vía profiles.getFiscal()/updateFiscal(). React Native
// has no native <select>, so SelectField (FormField.tsx) stands in for the reference's <select>.
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { profiles } from "../../lib/api";
import { MX_STATES } from "../../lib/mx-states";
import { BackButton } from "../shared/BackButton";
import { Card, Section } from "../query/components/VisualPrimitives";
import { SegmentedField, SelectField, TextField } from "./components/FormField";

export interface FiscalInfoScreenProps {
  onBack: () => void;
}

type PersonType = "individual" | "corporate";

const TAX_REGIMES = [
  "Régimen Simplificado de Confianza",
  "Personas Físicas con Actividad Empresarial",
  "Incorporación Fiscal",
  "Arrendamiento",
  "Salarios y Honorarios",
  "Plataformas Tecnológicas",
];

const STATE_OPTIONS = MX_STATES.map((state) => ({ value: String(state.code), label: state.label }));

export function FiscalInfoScreen({ onBack }: FiscalInfoScreenProps) {
  const [personType, setPersonType] = useState<PersonType>("individual");
  const [rfc, setRfc] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [taxRegime, setTaxRegime] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    profiles
      .getFiscal()
      .then((data) => {
        if (cancelled) return;
        setRfc(data.rfc ?? "");
        setTaxRegime(data.taxRegime ?? "");
        setBusinessName(data.businessName ?? "");
        setPersonType((data.personType as PersonType) ?? "individual");
        setPostalCode(data.postalCode ?? "");
        setStateCode(data.stateCode === null ? "" : String(data.stateCode));
        setAddress(data.fiscalAddress ?? "");
      })
      .catch(() => {
        // First time — no fiscal data saved yet.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await profiles.updateFiscal({
        rfc,
        taxRegime,
        businessName,
        personType,
        postalCode,
        fiscalAddress: address,
        stateCode: stateCode === "" ? undefined : Number(stateCode),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("No se pudieron guardar los datos fiscales");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]} testID="fiscal-info-screen">
      <View className="px-6 pb-10 pt-6">
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-text">Información fiscal</Text>
        <Text className="mb-6 mt-1 text-sm text-text/60">Informativo · no asesoría fiscal</Text>

        {loading ? (
          <View className="items-center py-6" testID="fiscal-info-loading">
            <ActivityIndicator />
          </View>
        ) : (
          <Section>
            <SegmentedField
              label="Tipo de persona"
              value={personType}
              onChange={(value) => setPersonType(value as PersonType)}
              options={[
                { value: "individual", label: "Física" },
                { value: "corporate", label: "Moral" },
              ]}
              testID="fiscal-person-type"
            />

            <TextField
              label="RFC"
              value={rfc}
              onChangeText={(text) => setRfc(text.toUpperCase())}
              placeholder={personType === "individual" ? "XAXX010101000" : "EMP010101AAA"}
              maxLength={personType === "individual" ? 13 : 12}
              autoCapitalize="characters"
              testID="fiscal-rfc"
            />

            <TextField
              label={personType === "individual" ? "Nombre completo" : "Razón social"}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder={personType === "individual" ? "Nombre Apellido" : "Empresa SA de CV"}
              testID="fiscal-business-name"
            />

            <SelectField
              label="Régimen fiscal"
              value={taxRegime}
              onChange={setTaxRegime}
              options={TAX_REGIMES.map((regime) => ({ value: regime, label: regime }))}
              testID="fiscal-tax-regime"
            />

            <SelectField
              label="Estado"
              value={stateCode}
              onChange={setStateCode}
              options={STATE_OPTIONS}
              placeholder="Selecciona tu estado"
              testID="fiscal-state"
            />
            <Text className="-mt-3 mb-4 text-xs leading-4 text-text/50">
              Se usa para buscar tu negocio en el directorio oficial. Sin él, un nombre común
              devuelve miles de coincidencias.
            </Text>

            <TextField
              label="Código postal"
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="01000"
              keyboardType="numeric"
              maxLength={5}
              testID="fiscal-postal-code"
            />

            <TextField
              label="Dirección fiscal"
              value={address}
              onChangeText={setAddress}
              placeholder="Calle, número, colonia, ciudad..."
              testID="fiscal-address"
            />

            <Card tone="highlight">
              <Text className="text-xs leading-4 text-text/70">
                Esta información es de referencia. Creva no otorga asesoría fiscal. Consulta a un
                contador para tus obligaciones fiscales.
              </Text>
            </Card>

            {error ? (
              <Text className="mb-3 mt-3 text-sm text-danger" testID="fiscal-info-error">
                {error}
              </Text>
            ) : null}
            {saved ? (
              <Text className="mb-3 mt-3 text-sm text-success" testID="fiscal-info-saved">
                Datos guardados
              </Text>
            ) : null}

            <Pressable
              className="mt-3 rounded-xl bg-crimson px-5 py-3"
              onPress={handleSave}
              disabled={saving}
              testID="fiscal-info-save-cta"
            >
              <Text className="text-center font-semibold text-white">
                {saving ? "Guardando…" : "Guardar cambios"}
              </Text>
            </Pressable>
          </Section>
        )}
      </View>
    </SafeAreaView>
  );
}
