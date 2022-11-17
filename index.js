import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import express from 'express'
import cors from 'cors'

dotenv.config()

const clientUrl = process.env.CLIENT_URL
const adminId = process.env.TELEGRAM_ADMIN_ID
const managerIds = process.env.TELEGRAM_MANAGERS_ID
const sendForManagers = process.env.TELEGRAM_SEND_FOR_MANAGERS

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true })
const app = express()

app.use(express.static('static'));
app.use(express.json())
app.use(cors({
  origin: true,
  methods: 'GET,PUT,POST,DELETE',
  credentials: true,
}));

bot.on('message', async (msg) => {
  const chatId = msg.chat.id

  await bot.sendMessage(chatId,
    '*Давайте начнем*\n\nПожалуйста, нажмите на кнопку ниже, чтобы заказать разработку',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Сделать заказ', web_app: { url: clientUrl } }],
        ],
      },
    })
})

app.post('/order', async (req, res) => {
  const { queryId, order, userName, userId } = req.body
  try {
    await bot.answerWebAppQuery(queryId, {
      id: queryId,
      type: 'article',
      title: 'Услуга заказана',
      input_message_content: {
        message_text: ` Вы успешно заказали услугу: ${order}. Мы скоро свяжемся с Вами!`,
      },
    })

    return res.status(200).send({ data: "okey" })
  } catch (e) {
    return res.status(500).send({ data: "not okey" })
  } finally {
    await bot.sendMessage(adminId, `Заказ от пользователя: https://t.me/${userName}.\nУслуга: ${order}. ID пользователя:  ${userId}`)

    if (sendForManagers !== 'false') {
      managerIds.split(',').map(async (managerId) => {
        await bot.sendMessage(managerId, `Заказ от пользователя: https://t.me/${userName}.\nУслуга: ${order}.`)
      })
    }
  }
})

const PORT = 8080

app.listen(PORT, () => console.log('server started on PORT ' + PORT))
