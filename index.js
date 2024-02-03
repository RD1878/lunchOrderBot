require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const {
    isAdmin,
    getStartButtons,
    getOrderButtons,
    getEndOfDayButtons,
    getCurrentHours,
    getWeekDays,
    getUploadMenuButtons,
    getChangeDayMenuButtons,
    lunchOrder,
} = require('./utils');
const {
    ORDER_END_HOUR,
    ORDER_START_HOUR,
    daysMap,
    rusWeekDays,
    orderTypes,
    ADMINS,
    USERS,
} = require('./constants');
const {
    updateMenuInNotion,
    createMenuInNotion,
    getOrdersCount,
    getMenuInNotion,
    clearDatabaseInNotion,
} = require('./notionFunctions');

const menuDatabaseId = process.env.NOTION_MENU_DATABASE_ID;
const ordersDatabaseId = process.env.NOTION_ORDERS_DATABASE_ID;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(telegramBotToken, { polling: true });

let currentAdminCommand = null;
let currentDay = null;

bot.on('callback_query', (callbackQuery) => {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const fromId = callbackQuery.from.id;

    switch (data) {
        case 'upload_menu': {
            if (isAdmin(fromId)) {
                getMenuInNotion(menuDatabaseId).then((res) => {
                    const menu =
                        res?.properties[daysMap['1']].rich_text[0]
                            ?.plain_text ?? '';

                    if (menu) {
                        bot.sendMessage(
                            chatId,
                            'Кажется меню на неделю уже загружено. Если хочешь заменить меню в какой-либо день, выбери пожалуйста',
                            getChangeDayMenuButtons(fromId)
                        );
                    } else {
                        currentAdminCommand = { type: 'UPLOAD_MENU' };

                        currentDay = daysMap['1'];
                        bot.sendMessage(
                            chatId,
                            `Загрузи пожалуйста меню на ${rusWeekDays[daysMap['1']].toLowerCase()}`
                        );
                    }
                });
            } else {
                bot.sendMessage(
                    chatId,
                    'Извини, но у тебя нет прав администратора для выполнения этой команды.'
                );
            }
            break;
        }

        case 'stop': {
            bot.answerCallbackQuery(callbackQuery.id);
            bot.sendMessage(chatId, 'Бот остановлен', {
                reply_markup: JSON.stringify({
                    keyboard: [[{ text: 'Старт' }]],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                }),
            });
            break;
        }

        case 'start': {
            bot.sendMessage(
                chatId,
                'Привет я бот заказа обедов компании Kite Group! Выбери действие:',
                getStartButtons(fromId)
            );
            break;
        }

        case 'get_menu': {
            const { menuWeekDay, orderWeekDay } = getWeekDays();

            if (
                orderWeekDay === daysMap['5'] ||
                orderWeekDay === daysMap['6']
            ) {
                bot.sendMessage(
                    chatId,
                    `Извини, но сегодня заказы не предусмотрены. Ждем тебя ориентировочно после ${ORDER_START_HOUR}:00 в воскресенье! Когда меню появится, тебе придет напоминалка!`,
                    getStartButtons(fromId)
                );
                break;
            }

            const currentHours = getCurrentHours();
            if (currentHours >= ORDER_END_HOUR) {
                bot.sendMessage(
                    chatId,
                    `Извини, но прием заказов сегодня закончен! Будем рады принять от тебя заказ завтра до ${ORDER_END_HOUR}:00`,
                    getEndOfDayButtons()
                );
                break;
            }

            getMenuInNotion(menuDatabaseId).then((res) => {
                const menu =
                    res?.properties[menuWeekDay].rich_text[0]?.plain_text ?? '';

                if (menu) {
                    bot.sendMessage(
                        chatId,
                        'Меню на ' +
                            `${rusWeekDays[menuWeekDay].toUpperCase()}\n\n${res.properties[menuWeekDay].rich_text[0].plain_text}`,
                        getOrderButtons()
                    );
                } else {
                    bot.sendMessage(
                        chatId,
                        `Меню еще не загружено. Скоро тебе придет уведомления о появлении меню, ориентировочно после ${ORDER_START_HOUR}:00 в воскресенье!`,
                        getStartButtons(chatId)
                    );
                }
            });
            break;
        }

        case 'get_orders': {
            const currentHours = getCurrentHours();
            const { orderWeekDay, menuWeekDay } = getWeekDays();

            if (
                orderWeekDay === daysMap['5'] ||
                orderWeekDay === daysMap['6']
            ) {
                bot.sendMessage(
                    chatId,
                    `Извини, но сегодня сбор заказов не предусмотрен. Ждем тебя после ${ORDER_END_HOUR}:00 в воскресенье!`,
                    getStartButtons(fromId)
                );
                break;
            } else if (currentHours < ORDER_END_HOUR) {
                bot.sendMessage(
                    chatId,
                    `Извини, но прием заказов еще не закончен! Возвращайся после ${ORDER_END_HOUR}:00`,
                    getEndOfDayButtons()
                );
                break;
            } else {
                getOrdersCount(ordersDatabaseId, menuWeekDay).then((res) => {
                    bot.sendMessage(
                        chatId,
                        `Заказы на ${rusWeekDays[menuWeekDay]}\n${res}`,
                        getStartButtons(fromId)
                    );
                });
                break;
            }
        }

        case 'update_monday_menu': {
            currentAdminCommand = { type: 'UPDATE_MENU', day: daysMap['1'] };
            bot.sendMessage(
                chatId,
                `Загрузи пожалуйста меню на ${rusWeekDays[daysMap['1']].toLowerCase()}`
            );
            break;
        }

        case 'update_tuesday_menu': {
            currentAdminCommand = { type: 'UPDATE_MENU', day: daysMap['2'] };
            bot.sendMessage(
                chatId,
                `Загрузи пожалуйста меню на ${rusWeekDays[daysMap['2']].toLowerCase()}`
            );
            break;
        }

        case 'update_wednesday_menu': {
            currentAdminCommand = { type: 'UPDATE_MENU', day: daysMap['3'] };
            bot.sendMessage(
                chatId,
                `Загрузи пожалуйста меню на ${rusWeekDays[daysMap['3']].toLowerCase()}`
            );
            break;
        }

        case 'update_thursday_menu': {
            currentAdminCommand = { type: 'UPDATE_MENU', day: daysMap['4'] };
            bot.sendMessage(
                chatId,
                `Загрузи пожалуйста меню на ${rusWeekDays[daysMap['4']].toLowerCase()}`
            );
            break;
        }

        case 'update_friday_menu': {
            currentAdminCommand = { type: 'UPDATE_MENU', day: daysMap['5'] };
            bot.sendMessage(
                chatId,
                `Загрузи пожалуйста меню на ${rusWeekDays[daysMap['5']].toLowerCase()}`
            );
            break;
        }

        case 'order_standard_1': {
            lunchOrder({
                orderType: orderTypes.standardOne,
                databaseId: ordersDatabaseId,
                fromId,
                chatId,
                bot,
            });
            break;
        }

        case 'order_standard_2': {
            lunchOrder({
                orderType: orderTypes.standardTwo,
                databaseId: ordersDatabaseId,
                fromId,
                chatId,
                bot,
            });
            break;
        }

        case 'order_vip': {
            lunchOrder({
                orderType: orderTypes.standardVIP,
                databaseId: ordersDatabaseId,
                fromId,
                chatId,
                bot,
            });
            break;
        }
    }

    bot.answerCallbackQuery(callbackQuery.id);
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id;

    if (!USERS.includes(fromId)) {
        bot.sendMessage(
            chatId,
            'Извини, но у тебя нет доступа к этому боту. Если ты хочешь заказывать обеды в компании Kite Group, обратись к администратору бота.',
            getEndOfDayButtons()
        );
        return;
    }

    bot.sendMessage(
        chatId,
        'Привет я бот заказа обедов компании Kite Group! Выбери действие:',
        getStartButtons(fromId)
    );
});

bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;

    const options = {
        reply_markup: JSON.stringify({
            keyboard: [[{ text: '/start' }]],
            resize_keyboard: true,
            one_time_keyboard: true,
        }),
    };

    bot.sendMessage(chatId, 'Бот остановлен', options);
});

bot.on('message', (msg) => {
    if (msg.text === 'Старт') {
        const chatId = msg.chat.id;
        const fromId = msg.from.id;

        if (!USERS.includes(fromId)) {
            bot.sendMessage(
                chatId,
                'Извини, но у тебя нет доступа к этому боту. Если ты хочешь заказывать обеды в компании Kite Group, обратись к администратору бота.',
                getEndOfDayButtons()
            );
            return;
        }

        bot.sendMessage(
            chatId,
            'Привет я бот заказа обедов компании Kite Group! Выбери действие:',
            getStartButtons(fromId)
        );
    }
});

bot.on('message', async (msg) => {
    if (!currentAdminCommand || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const fromId = msg.from.id;

    if (isAdmin(fromId)) {
        if (currentAdminCommand.type === 'UPDATE_MENU') {
            const { day } = currentAdminCommand;
            await updateMenuInNotion(menuDatabaseId, msg.text, day);
            bot.sendMessage(chatId, `Меню обновлено`, getStartButtons(fromId));
            currentAdminCommand = null;
            return;
        }

        switch (currentDay) {
            case daysMap['1']:
                await createMenuInNotion(
                    menuDatabaseId,
                    msg.text,
                    daysMap['1']
                );
                currentDay = daysMap['2'];
                bot.sendMessage(chatId, 'Загрузи пожалуйста меню на вторник');
                break;
            case daysMap['2']:
                await updateMenuInNotion(
                    menuDatabaseId,
                    msg.text,
                    daysMap['2']
                );
                currentDay = daysMap['3'];
                bot.sendMessage(chatId, 'Загрузи пожалуйста меню на среду');
                break;
            case daysMap['3']:
                await updateMenuInNotion(
                    menuDatabaseId,
                    msg.text,
                    daysMap['3']
                );
                currentDay = daysMap['4'];
                bot.sendMessage(chatId, 'Загрузи пожалуйста меню на четверг');
                break;
            case daysMap['4']:
                await updateMenuInNotion(
                    menuDatabaseId,
                    msg.text,
                    daysMap['4']
                );
                currentDay = daysMap['5'];
                bot.sendMessage(chatId, 'Загрузи пожалуйста меню на пятницу');
                break;
            case daysMap['5']:
                await updateMenuInNotion(
                    menuDatabaseId,
                    msg.text,
                    daysMap['5']
                );
                currentDay = null;
                currentAdminCommand = null;

                for (const chatId of USERS) {
                    bot.sendMessage(
                        chatId,
                        'Меню загружено! Поспеши сделать заказ на завтра до 20:00',
                        getStartButtons(chatId)
                    ).then(() => {
                        clearDatabaseInNotion(ordersDatabaseId);
                    });
                }
                break;
        }
    }
});

async function sendMenuUploadReminder() {
    const adminId = ADMINS.Olga;

    bot.sendMessage(
        adminId,
        'Не забудь загрузить меню на следующую неделю!',
        getUploadMenuButtons(adminId)
    );
}

async function sendOrderReminder() {
    for (const chatId of USERS) {
        bot.sendMessage(
            chatId,
            'Через час закроется прием заказа на обед на завтра! Если не заказывал, поспеши чтобы не остаться без обеда!',
            getStartButtons(chatId)
        );
    }
}

cron.schedule(`0 ${ORDER_START_HOUR} * * 0`, () => {
    sendMenuUploadReminder();
});

cron.schedule(`0 ${ORDER_END_HOUR - 1} * * 1-4`, () => {
    sendOrderReminder();
});

cron.schedule(`0 ${ORDER_END_HOUR} * * 5`, () => {
    clearDatabaseInNotion(menuDatabaseId);
});
