import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/lib/queries";
import type { ServiceItem } from "@/lib/graphql/types";

interface FormState {
  code: string;
  name: string;
  description: string;
  category: string;
  type: string;
  defaultDurationMins: string;
}

const emptyForm: FormState = {
  code: "",
  name: "",
  description: "",
  category: "",
  type: "",
  defaultDurationMins: "",
};

function toInput(form: FormState) {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    category: form.category.trim() || null,
    type: form.type.trim() || null,
    defaultDurationMins: form.defaultDurationMins.trim()
      ? Number(form.defaultDurationMins)
      : null,
  };
}

export default function Services() {
  const { data: services, isLoading, error } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSubmit = form.code.trim() && form.name.trim();

  const startEdit = (s: ServiceItem) => {
    setEditingId(s.id);
    setForm({
      code: s.code,
      name: s.name,
      description: s.description ?? "",
      category: s.category ?? "",
      type: s.type ?? "",
      defaultDurationMins: s.defaultDurationMins?.toString() ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (editingId) {
      await updateService.mutateAsync({ id: editingId, input: toInput(form) });
    } else {
      await createService.mutateAsync({ input: toInput(form) });
    }
    cancelEdit();
  };

  const saving = createService.isPending || updateService.isPending;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Service catalog</Text>
      <Text style={styles.hint}>
        Central system-of-record. Consumer apps (PedConnect) sync from here.
      </Text>

      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingId ? "Edit service" : "New service"}
        </Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={form.code}
            onChangeText={set("code")}
            placeholder="Code *"
            autoCapitalize="characters"
          />
          <TextInput
            style={[styles.input, styles.inputGrow]}
            value={form.name}
            onChangeText={set("name")}
            placeholder="Name *"
          />
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputGrow]}
            value={form.category}
            onChangeText={set("category")}
            placeholder="Category"
          />
          <TextInput
            style={[styles.input, styles.inputGrow]}
            value={form.type}
            onChangeText={set("type")}
            placeholder="Type"
          />
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={form.defaultDurationMins}
            onChangeText={set("defaultDurationMins")}
            placeholder="Mins"
            keyboardType="numeric"
          />
        </View>
        <TextInput
          style={styles.input}
          value={form.description}
          onChangeText={set("description")}
          placeholder="Description"
          multiline
        />
        <View style={styles.row}>
          <Pressable
            style={[styles.button, (!canSubmit || saving) && styles.buttonDisabled]}
            disabled={!canSubmit || saving}
            onPress={submit}
          >
            <Text style={styles.buttonText}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create service"}
            </Text>
          </Pressable>
          {editingId && (
            <Pressable style={styles.buttonGhost} onPress={cancelEdit}>
              <Text style={styles.buttonGhostText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>

      {isLoading && <ActivityIndicator style={styles.spinner} />}
      {error && <Text style={styles.error}>{String(error)}</Text>}

      {services?.map((s) => (
        <View key={s.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.code}>{s.code}</Text>
            <Text style={styles.name}>{s.name}</Text>
            <View style={[styles.badge, s.isActive ? styles.badgeOn : styles.badgeOff]}>
              <Text style={s.isActive ? styles.badgeOnText : styles.badgeOffText}>
                {s.isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <Text style={styles.meta}>
            {[s.category, s.type, s.defaultDurationMins ? `${s.defaultDurationMins} mins` : null]
              .filter(Boolean)
              .join(" · ") || "—"}
          </Text>
          {!!s.description && <Text style={styles.description}>{s.description}</Text>}
          <View style={styles.cardActions}>
            <Pressable style={styles.buttonGhost} onPress={() => startEdit(s)}>
              <Text style={styles.buttonGhostText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.buttonGhost}
              onPress={() => updateService.mutate({ id: s.id, input: { isActive: !s.isActive } })}
            >
              <Text style={styles.buttonGhostText}>
                {s.isActive ? "Deactivate" : "Activate"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.buttonGhost}
              onPress={() => deleteService.mutate({ id: s.id })}
            >
              <Text style={styles.buttonDangerText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
      {services && !services.length && (
        <Text style={styles.hint}>No services yet. Create one above.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, maxWidth: 720, width: "100%", alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "600" },
  hint: { color: "#666" },
  form: {
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },
  formTitle: { fontWeight: "600", marginBottom: 4 },
  row: { flexDirection: "row", gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  inputSmall: { width: 96 },
  inputGrow: { flex: 1 },
  button: {
    backgroundColor: "#1d4ed8",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonGhost: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonGhostText: { color: "#1d4ed8", fontWeight: "600" },
  buttonDangerText: { color: "#b91c1c", fontWeight: "600" },
  spinner: { marginTop: 16 },
  error: { color: "#b91c1c" },
  card: {
    gap: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  code: {
    fontFamily: "monospace",
    fontWeight: "700",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  name: { fontWeight: "600", fontSize: 16, flex: 1 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeOn: { backgroundColor: "#dcfce7" },
  badgeOff: { backgroundColor: "#f3f4f6" },
  badgeOnText: { color: "#15803d", fontWeight: "600", fontSize: 12 },
  badgeOffText: { color: "#6b7280", fontWeight: "600", fontSize: 12 },
  meta: { color: "#666", fontSize: 13 },
  description: { color: "#444" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
});
