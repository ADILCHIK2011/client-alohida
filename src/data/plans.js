export const PLAN_PRICES = {
  starter: 300000,
  pro: 550000,
};

export const PLAN_FEATURES = {
  starter: [
    { text: 'Kassa va shtrix-kod skanerlash', included: true },
    { text: 'Mahsulotlar va ombor boshqaruvi', included: true },
    { text: "Savdolar tarixi va tahlillar", included: true },
    { text: "Kamayib qolgan mahsulot bildirishnomalari", included: true },
    { text: "Shtrix-kod generatori", included: true },
    { text: "Eng ko'pi 3 ta xodim", included: true },
    { text: 'AI yordamchi', included: false },
    { text: 'Telegram bot', included: false },
    { text: "Excel'ga eksport", included: false },
  ],
  pro: [
    { text: "Oddiy rejadagi barcha imkoniyatlar", included: true },
    { text: 'AI yordamchi — savdo va omborga oid savollarga javob', included: true },
    { text: "Telegram bot — kunlik hisobot va bildirishnomalar", included: true },
    { text: "Cheksiz xodim qo'shish", included: true },
    { text: "Savdolar va mahsulotlarni Excel'ga eksport qilish", included: true },
  ],
};
