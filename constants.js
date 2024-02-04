const ORDER_END_HOUR = 20;
const ORDER_START_HOUR = 15;

const daysMap = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    0: 'Sunday',
};

const rusWeekDays = {
    [daysMap['1']]: 'Понедельник',
    [daysMap['2']]: 'Вторник',
    [daysMap['3']]: 'Среда',
    [daysMap['4']]: 'Четверг',
    [daysMap['5']]: 'Пятница',
    [daysMap['6']]: 'Суббота',
    [daysMap['7']]: 'Воскресенье',
};

const orderTypes = {
    standardOne: 'Стандарт 1',
    standardTwo: 'Стандарт 2',
    standardVIP: 'VIP',
};

module.exports = {
    ORDER_END_HOUR,
    ORDER_START_HOUR,
    daysMap,
    rusWeekDays,
    orderTypes,
};
