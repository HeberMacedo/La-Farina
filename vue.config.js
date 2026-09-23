const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath:
    process.env.VUE_APP_PUBLIC_PATH ||
    (process.env.NODE_ENV === "production" ? "/tpizza-artesanal/" : "/"),
});
