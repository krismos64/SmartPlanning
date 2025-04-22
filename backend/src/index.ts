import app from "./app";

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`🚀 Serveur SmartPlanning lancé sur http://localhost:${PORT}`);
});
