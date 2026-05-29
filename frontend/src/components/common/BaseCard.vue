<!-- ==========================================
  components/common/BaseCard.vue
  ==========================================
  Reusable card wrapper component used by
  all dashboard panel components.

  Props:
    title   — card header label (optional)
    icon    — emoji icon for the header (optional)
    padding — inner padding override (optional)

  Slots:
    default — card body content
    header  — custom header (overrides title/icon)
    footer  — optional footer content
========================================== -->

<template>
  <div class="base-card">

    <!-- Header -->
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <div class="card-title">
          <span v-if="$slots.icon" class="card-icon" aria-hidden="true">
            <slot name="icon"></slot>
          </span>
          <span v-else-if="icon" class="card-icon" aria-hidden="true">{{ icon }}</span>
          <span class="card-title-text">{{ title }}</span>
        </div>
      </slot>
    </div>

    <!-- Divider between header and body -->
    <div v-if="$slots.header || title" class="card-divider"></div>

    <!-- Body -->
    <div class="card-body" :style="padding ? { padding } : {}">
      <slot></slot>
    </div>

    <!-- Footer -->
    <template v-if="$slots.footer">
      <div class="card-divider"></div>
      <div class="card-footer">
        <slot name="footer"></slot>
      </div>
    </template>

  </div>
</template>

<script setup>
defineProps({
  title:   { type: String,  default: null  },
  icon:    { type: String,  default: null  },
  padding: { type: String,  default: null  },
})
</script>

<style scoped>
.base-card {
  background: #fbfcf8;
  border: 0.5px solid #e0e0d8;
  border-radius: 12px;
  overflow: hidden;
}
.card-header {
  padding: 12px 16px 10px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 7px;
}
.card-icon   { font-size: 15px; }
.card-title-text {
  font-size: 13px;
  font-weight: 500;
  color: #5F5E5A;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.card-divider {
  height: 0.5px;
  background: #e0e0d8;
}
.card-body {
  padding: 14px 16px;
}
.card-footer {
  padding: 10px 16px;
  background: #F1EFE8;
}
</style>