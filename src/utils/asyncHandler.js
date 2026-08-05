// Har bir async controllerni try/catch bilan o'rab, xatolikni
// avtomatik error middleware'ga uzatadi.
// Eslatma: Express 5'da async handlerlardagi xatolik avtomatik tutiladi,
// shuning uchun bu wrapper endi shart emas, lekin zarar ham qilmaydi -
// aniqlik va eski kod bilan mosligi uchun saqlab qo'yildi.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
