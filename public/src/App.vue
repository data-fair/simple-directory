<template>
<div>
  <md-toolbar>
    <h2 class="md-title">Simple Directory</h2>
    <span style="flex:1"></span>
    <router-link to="/" style="color:white;">
      <md-button>Home</md-button>
    </router-link>
    <router-link to="/login" style="color:white;">
      <md-button>Login</md-button>
    </router-link>
    <router-link to="/api-doc" style="color:white;">
      <md-button>API documentation</md-button>
    </router-link>
  </md-toolbar>
  <router-view></router-view>
</div>
</template>

<script>
export default {
  name: 'app'
}
</script>
