<template>
  <div id="main-banner">
    <div class="banner-content">
      <span>PIZZARIA ARTESANAL</span>

      <h1>La Farina</h1>

      <p>
        Sabor artesanal em cada fatia.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "BannerComponent",
};
</script>

<style scoped>
#main-banner {
  min-height: 360px;

  padding: 40px;

  display: flex;
  align-items: center;
  justify-content: flex-end;

  background-image:
    linear-gradient(
      90deg,
      rgba(20, 10, 7, 0.08),
      rgba(20, 10, 7, 0.68)
    ),
    url("https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1600&q=80");

  background-position: center;
  background-size: cover;
}

.banner-content {
  width: min(520px, 100%);

  padding: 35px;

  border: 1px solid
    rgba(255, 255, 255, 0.12);

  border-radius: 24px;

  background:
    rgba(37, 17, 12, 0.76);

  backdrop-filter: blur(12px);

  text-align: left;

  box-shadow:
    0 25px 60px
    rgba(0, 0, 0, 0.28);
}

.banner-content span {
  color: #ffb197;

  font-size: 11px;
  font-weight: 900;

  letter-spacing: 3px;
}

.banner-content h1 {
  margin: 8px 0 10px;

  color: white;

  font-size: 52px;
  line-height: 1;
}

.banner-content p {
  margin: 0;

  color: #f3ded7;

  font-size: 16px;
}

@media (max-width: 700px) {
  #main-banner {
    min-height: 300px;

    padding: 20px;

    align-items: flex-end;
  }

  .banner-content {
    padding: 25px;
  }

  .banner-content h1 {
    font-size: 38px;
  }
}
</style>