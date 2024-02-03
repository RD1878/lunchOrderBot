const { ADMINS, orderTypes, rusWeekDays, daysMap } = require('./constants');
const { updateOrderInNotion } = require('./notionFunctions');

const isAdmin = (userId) => {
    return Object.values(ADMINS).includes(userId);
};

const getStartButtons = (fromId) => {
    return {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                isAdmin(fromId)
                    ? [
                          {
                              text: '📝 Загрузить меню',
                              callback_data: 'upload_menu',
                          },
                          {
                              text: '📊Получить заказы на завтра',
                              callback_data: 'get_orders',
                          },
                      ]
                    : [],
                [
                    {
                        text: '📋Заказать обед',
                        callback_data: 'get_menu',
                    },
                ],
                [{ text: '🛑Стоп', callback_data: 'stop' }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        }),
    };
};

const getUploadMenuButtons = (fromId) => {
    return {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                isAdmin(fromId)
                    ? [
                          {
                              text: '📝Загрузить меню',
                              callback_data: 'upload_menu',
                          },
                      ]
                    : [],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        }),
    };
};

const getChangeDayMenuButtons = (fromId) => {
    return {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                isAdmin(fromId)
                    ? [
                          {
                              text: rusWeekDays[daysMap['1']],
                              callback_data: 'update_monday_menu',
                          },
                          {
                              text: rusWeekDays[daysMap['2']],
                              callback_data: 'update_tuesday_menu',
                          },
                      ]
                    : [],
                isAdmin(fromId)
                    ? [
                          {
                              text: rusWeekDays[daysMap['3']],
                              callback_data: 'update_wednesday_menu',
                          },
                          {
                              text: rusWeekDays[daysMap['4']],
                              callback_data: 'update_thursday_menu',
                          },
                      ]
                    : [],
                isAdmin(fromId)
                    ? [
                          {
                              text: rusWeekDays[daysMap['5']],
                              callback_data: 'update_friday_menu',
                          },
                          { text: '↩️Назад', callback_data: 'start' },
                      ]
                    : [],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        }),
    };
};

const getEndOfDayButtons = () => {
    return {
        reply_markup: JSON.stringify({
            inline_keyboard: [[{ text: '↩️Назад', callback_data: 'start' }]],
            resize_keyboard: true,
            one_time_keyboard: true,
        }),
    };
};

const getOrderButtons = () => {
    return {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [
                    {
                        text: `🍲 ${orderTypes.standardOne}`,
                        callback_data: 'order_standard_1',
                    },
                ],
                [
                    {
                        text: `🍛 ${orderTypes.standardTwo}`,
                        callback_data: 'order_standard_2',
                    },
                ],
                [
                    {
                        text: `🍱${orderTypes.standardVIP}`,
                        callback_data: 'order_vip',
                    },
                ],
                [{ text: '🛑Стоп', callback_data: 'stop' }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        }),
    };
};

const getCurrentHours = () => new Date().getHours();

const getWeekDays = () => {
    return {
        orderWeekDay: daysMap[new Date().getDay()],
        menuWeekDay: daysMap[new Date().getDay() + 1],
    };
};

const lunchOrder = async ({ orderType, databaseId, fromId, chatId, bot }) => {
    const { menuWeekDay } = getWeekDays();

    await updateOrderInNotion(databaseId, fromId, orderType, menuWeekDay);
    await bot.sendMessage(
        chatId,
        `Спасибо! Ты заказал ${orderType} на ${rusWeekDays[menuWeekDay]}`,
        getStartButtons(fromId)
    );
};

module.exports = {
    isAdmin,
    getEndOfDayButtons,
    getStartButtons,
    getUploadMenuButtons,
    getChangeDayMenuButtons,
    getOrderButtons,
    getCurrentHours,
    getWeekDays,
    lunchOrder,
};
