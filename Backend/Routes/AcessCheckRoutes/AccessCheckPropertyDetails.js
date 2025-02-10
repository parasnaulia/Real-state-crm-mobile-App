const express = require("express");

const mySqlPool = require("../../config/db.js");
// const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticateToken } = require("../../Middlewares/RoutesAuth.js");

const router = express.Router();

router.get(
  "/checkPropertyAccess/:userId/:purchaseId",
  authenticateToken,
  async (req, res) => {
    const { userId, purchaseId } = req.params;

    try {
      const [rows] = await mySqlPool.query(
        `SELECT * FROM  purchaseorder Where Purchase_id=? AND Lead_Owner_Name=?`,
        [purchaseId, userId]
      );

      if (rows.length > 0) {
        return res.status(200).send({
          message: "This user have aceess to view this propert details page",
          success: true,
          data: rows,
        });
      } else {
        return res.status(404).send({
          message:
            "This user have no  aceess to view this propert details page",
          success: false,
          data: [],
        });
      }
    } catch (e) {
      console.error(
        "This user have no aceess to view this propert details page",
        e
      );
      return res.status(500).send({
        message: "This user have no aceess to view this propert details page",
        success: false,
        error: e.message,
      });
    }
  }
);

router.get(
  "/checkleadsAccess/:userId/:leadId",
  authenticateToken,
  async (req, res) => {
    const { userId, leadId } = req.params;

    try {
      const [rows] = await mySqlPool.query(
        `SELECT * FROM  lead_user Where Lead_ID_User=? AND User_Id_User_Lead=?`,
        [leadId, userId]
      );

      if (rows.length > 0) {
        return res.status(200).send({
          message: "This user have aceess to view this propert details page",
          success: true,
          data: rows,
        });
      } else {
        return res.status(404).send({
          message:
            "This user have no  aceess to view this propert details page",
          success: false,
          data: [],
        });
      }
    } catch (e) {
      console.error(
        "This user have no aceess to view this propert details page",
        e
      );
      return res.status(500).send({
        message: "This user have no aceess to view this propert details page",
        success: false,
        error: e.message,
      });
    }
  }
);

module.exports = router;
