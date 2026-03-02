const { Lesson } = require("../models");
const { Op } = require('sequelize');

exports.updatePastLessons = async () => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); 

    const [updatedCount] = await Lesson.update(
      { status: 'completed' },
      {
        where: {
          status: 'planned',
          [Op.or]: [
            { date: { [Op.lt]: todayStr } },
            {
              [Op.and]: [
                { date: todayStr },
                { endTime: { [Op.lte]: currentTime } }
              ]
            }
          ]
        }
      }
    );

    if (updatedCount > 0) {
      console.log(`[CRON] ${updatedCount} lejárt óra frissítve.`);
    }
  } catch (error) {
    console.error("[CRON] Hiba:", error);
  }
};