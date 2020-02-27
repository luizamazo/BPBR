import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "login",
    component: () => import("../src/components/Auth/Login")
  },
  
];

const router = new VueRouter({
  routes
});

export default router;
