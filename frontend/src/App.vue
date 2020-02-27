<template>
  <div id="material-kit">
    <div :class="{ 'nav-open': NavbarStore.showNavbar }">
      <router-view name="header" />
      <div>
        <router-view />
      </div>
      <router-view name="footer" />
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css?family=Quicksand&display=swap");
  #app {
    font-family: 'Quicksand'
  }
</style>
