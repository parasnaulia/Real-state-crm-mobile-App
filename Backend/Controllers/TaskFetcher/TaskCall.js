const mySqlPool = require("../../config/db"); // Assuming you have a MySQL pool setup in a config file

const TaskCallFetcher = async (id) => {
  try {
    const [activityLogs] = await mySqlPool.query(
      `
      SELECT 
        a.Task_ID, a.Task_Title, a.Task_Type, a.Description, a.Due_Date, 
        a.Priority, a.Assigned_To, a.Status, a.Lead_Id, a.Reminders, 
        a.Attachments, a.Notes, a.Next_follow_up_date, 
        a.Organization_Name_Activity, a.Assign_To_Email, a.Created_Date, 
        u.Name AS User_Name 
      FROM 
        activity_logs AS a 
      JOIN 
        users AS u ON a.Assigned_To = u.User_Id 
      WHERE 
        a.Lead_Id = ?
      `,
      [id]
    );

    // Fetching call tasks
    const [callTasks] = await mySqlPool.query(
      `SELECT * FROM call_task WHERE Lead_ID_Call = ?`,
      [id]
    );
    return [activityLogs, callTasks];
  } catch (e) {
    console.log("There is Some Error in Fecthing The Call and Task " + e);
    throw e;
  }
};

const superAdminTask = async () => {
  try {
    const [rows] = await mySqlPool.query(
      `
      SELECT 
        A.Task_Title AS Task_Name, 
        A.Due_Date, 
        A.Lead_Id, 
        A.Status, 
        A.Task_ID
      FROM 
        users AS u 
      JOIN 
        activity_logs AS A 
      ON 
        A.Assigned_To = u.User_Id 
      WHERE 
        u.Designation = ?
      `,
      ["Organization"]
    );

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Transform data to the required format with `status` calculation
    const tasks = rows.map((task) => {
      const dueDate = new Date(task.Due_Date);
      const dueDateStr = dueDate.toISOString().split("T")[0];

      let status = "pending";
      if (dueDateStr < todayStr) {
        status = "overdue";
      } else if (dueDateStr === todayStr) {
        status = "due_today";
      }

      return {
        taskName: task.Task_Name,
        taskId: task.Task_ID,
        dueDate: dueDate.toISOString(),
        leadId: task.Lead_Id,
        status,
        taskStatus: task.Status,
      };
    });

    return tasks;
  } catch (e) {
    console.log("There is Some Errror In Fetching Task For Super Admin " + e);
    throw e;
  }
};
const deleteCall = async (callId) => {
  try {
    const result = await mySqlPool.query(
      `DELETE FROM call_task WHERE Call_ID = ?`,
      [callId]
    );
    return result;
  } catch (e) {
    console.log("There is Some error in Fetching call Data " + e);
    throw e;
  }
};
const callEdit = async (
  callDate,
  callerName,
  callerPhoneNumber,
  callDuration,
  notes,
  leadId,
  reminders,
  callId,
  req
) => {
  try {
    const data = await mySqlPool.query(
      `UPDATE call_task 
       SET Call_Date = ?, 
           Caller_Name = ?, 
           Caller_Phone_Number = ?, 
           Call_Duration = ?, 
           Notes = ?, 
           Lead_ID_Call = ?, 
           User_Email = ?, 
           Reminder = ? 
       WHERE Call_ID = ?`, // Update the row where Call_ID matches
      [
        callDate,
        callerName,
        callerPhoneNumber,
        callDuration,
        notes,
        leadId,
        req.body.credOrg, // Assuming this is User_Email
        reminders,
        callId, // The ID to match for the update
      ]
    );
    return data;
  } catch (e) {
    console.log("There is Some Error in Updaring The Task " + e);
    throw e;
  }
};

module.exports = {
  TaskCallFetcher,
  superAdminTask,
  deleteCall,
  callEdit,
};
