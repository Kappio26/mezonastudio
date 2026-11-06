export default defineEventHandler(async () => {
  throw createError({
    statusCode: 400,
    statusMessage: 'Perpanjangan membership kini mewajibkan verifikasi bukti pembayaran melalui menu Beli / Perpanjang Paket di dasbor member.'
  })
})
