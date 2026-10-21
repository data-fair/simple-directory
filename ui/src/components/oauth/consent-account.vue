<template>
  <v-select
    v-model="selected"
    :items="items"
    item-title="title"
    item-value="key"
    item-props="props"
    :label="$t('pages.oauthConsent.account')"
    density="comfortable"
    variant="outlined"
    rounded
    hide-details
    name="account"
  />
</template>

<script lang="ts" setup>
type ConsentAccount = { type: 'user' | 'organization', id: string, department?: string, departmentName?: string, name: string }

const props = defineProps<{ accounts: ConsentAccount[] }>()
const { t } = useI18n()

const keyOf = (a: ConsentAccount) => `${a.type}:${a.id}:${a.department ?? ''}`

const items = computed(() => props.accounts.map(a => ({
  key: keyOf(a),
  account: a,
  props: { subtitle: a.type === 'user' ? t('pages.oauthConsent.personalAccount') : t('pages.oauthConsent.organizationAccount') },
  title: a.department ? `${a.name} / ${a.departmentName ?? a.department}` : a.name
})))

// the parent holds the account itself, the select works on its key
const model = defineModel<ConsentAccount | undefined>({ required: true })
const selected = computed({
  get: () => model.value ? keyOf(model.value) : undefined,
  set: (key) => { model.value = props.accounts.find(a => keyOf(a) === key) }
})
</script>
