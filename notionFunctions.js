const { Client } = require('@notionhq/client');
const { orderTypes } = require('./constants');

const notionApiKey = process.env.NOTION_API_KEY;

const notion = new Client({ auth: notionApiKey });

const MENU_ID = 'row_id';

const queryDatabase = async (databaseId, propertyName, propertyValue) => {
    try {
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: propertyName,
                title: {
                    contains: propertyValue,
                },
            },
        });
        return response.results[0]?.id ?? null;
    } catch (error) {
        console.error('Ошибка при запросе данных в Notion:', error);
    }
};

const createMenuInNotion = async (databaseId, dayMenu, weekDay) => {
    try {
        const response = await queryDatabase(databaseId, 'id', MENU_ID);

        if (response) {
            await updateMenuInNotion(databaseId, dayMenu, weekDay);
        } else {
            await notion.pages.create({
                parent: { database_id: databaseId },
                properties: {
                    id: {
                        type: 'title',
                        title: [
                            {
                                type: 'text',
                                text: {
                                    content: MENU_ID,
                                },
                            },
                        ],
                    },
                    [weekDay]: {
                        type: 'rich_text',
                        rich_text: [
                            {
                                type: 'text',
                                text: { content: dayMenu },
                            },
                        ],
                    },
                },
            });
        }
    } catch (error) {
        console.error('Ошибка при сохранении меню в Notion:', error);
    }
};

const getMenuInNotion = async (databaseId) => {
    try {
        const pageId = await queryDatabase(databaseId, 'id', MENU_ID);

        if (!pageId) {
            return null;
        } else {
            return await notion.pages.retrieve({ page_id: pageId });
        }
    } catch (error) {
        console.error('Ошибка при получении меню из Notion:', error);
    }
};

const getOrdersInNotion = async (databaseId, menuWeekDay, orderType) => {
    return await notion.databases.query({
        database_id: databaseId,
        filter: {
            property: menuWeekDay,
            title: {
                contains: orderType,
            },
        },
    });
};

const getOrdersCount = async (dataBaseId, menuWeekDay) => {
    let resultMessage = '';

    await getOrdersInNotion(
        dataBaseId,
        menuWeekDay,
        orderTypes.standardOne
    ).then((res) => {
        resultMessage = `${resultMessage}${orderTypes.standardOne}: ${res.results.length}\n`;
    });

    await getOrdersInNotion(
        dataBaseId,
        menuWeekDay,
        orderTypes.standardTwo
    ).then((res) => {
        resultMessage = `${resultMessage}${orderTypes.standardTwo}: ${res.results.length}\n`;
    });

    await getOrdersInNotion(
        dataBaseId,
        menuWeekDay,
        orderTypes.standardVIP
    ).then((res) => {
        resultMessage = `${resultMessage}${orderTypes.standardVIP}: ${res.results.length}`;
    });

    return resultMessage;
};

const getDataUsers = async (databaseId) => {
    const validUsers = [];
    const admins = [];

    const res = await notion.databases.query({
        database_id: databaseId,
    });

    res.results.forEach((page) => {
        validUsers.push(
            Number(page.properties['telegram_id'].rich_text[0].plain_text)
        );

        if (page.properties['isAdmin'].rich_text[0]?.plain_text === 'true') {
            admins.push(
                Number(page.properties['telegram_id'].rich_text[0].plain_text)
            );
        }
    });

    return {
        validUsers,
        admins,
    };
};

const updateOrderInNotion = async (databaseId, fromId, orderType, weekDay) => {
    try {
        const pageId = await queryDatabase(
            databaseId,
            'telegram_id',
            `${fromId}`
        );

        if (pageId) {
            await notion.pages.update({
                page_id: pageId,
                properties: {
                    [weekDay]: {
                        type: 'rich_text',
                        rich_text: [
                            {
                                type: 'text',
                                text: { content: orderType },
                            },
                        ],
                    },
                },
            });
        } else {
            await notion.pages.create({
                parent: { database_id: databaseId },
                properties: {
                    telegram_id: {
                        title: [{ text: { content: `${fromId}` } }],
                    },
                    [weekDay]: {
                        rich_text: [
                            {
                                text: { content: orderType },
                            },
                        ],
                    },
                },
            });
        }
    } catch (error) {
        console.error('Ошибка при обновлении заказа:', error);
    }
};

const updateMenuInNotion = (databaseId, dayMenu, weekDay) => {
    queryDatabase(databaseId, 'id', MENU_ID).then(async (pageId) => {
        try {
            await notion.pages.update({
                page_id: pageId,
                properties: {
                    [weekDay]: {
                        type: 'rich_text',
                        rich_text: [
                            {
                                type: 'text',
                                text: { content: dayMenu },
                            },
                        ],
                    },
                },
            });
        } catch (error) {
            console.error('Ошибка при обновлении меню:', error);
        }
    });
};

async function clearDatabaseInNotion(databaseId) {
    try {
        const response = await notion.databases.query({
            database_id: databaseId,
        });

        const pages = response.results;

        for (const page of pages) {
            if (page.archived) {
                await notion.pages.update({
                    page_id: page.id,
                    archived: false,
                });
            }

            await notion.pages.update({
                page_id: page.id,
                archived: true,
            });
        }
    } catch (error) {
        console.error('Ошибка при очистке базы данных:', error);
    }
}

module.exports = {
    createMenuInNotion,
    updateMenuInNotion,
    getMenuInNotion,
    queryDatabase,
    updateOrderInNotion,
    getOrdersInNotion,
    getOrdersCount,
    getDataUsers,
    clearDatabaseInNotion,
};
