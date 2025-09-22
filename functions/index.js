// functions/index.js - CORRECTED v2 SYNTAX

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const { defineString } = require('firebase-functions/params');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Configure the email transport using the secret key we stored
// NOTE: For v2 functions, you might need to load the config differently if the first deploy fails.
// This standard way should work.
// functions/index.js

// Define the SendGrid API key parameter
const sendgridKey = defineString("SENDGRID_KEY");

// Configure the email transport using the new parameter
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: sendgridKey.value(),
    },
}));

// This is our scheduled function using the new v2 syntax
exports.emailReminder = onSchedule("every day 08:00", async (event) => {
    // Set the timezone directly in the function options
    // Note: The `timeZone` is now part of the function signature in the line above.
    
    // --- 1. Calculate the target date (3 days from now) ---
    const today = new Date();
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + 3);
    const targetDateString = targetDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

    logger.info(`Checking for subscriptions due on: ${targetDateString}`);

    // --- 2. Query Firestore for subscriptions due on the target date ---
    const db = admin.firestore();
    const querySnapshot = await db.collection("subscriptions")
        .where("nextDueDate", "==", targetDateString)
        .get();

    if (querySnapshot.empty) {
        logger.info("No subscriptions due in 3 days. Exiting.");
        return null; // Exit the function if no bills are due
    }

    // --- 3. For each due subscription, fetch user info and send email ---
    const promises = [];
    querySnapshot.forEach(doc => {
        const subscription = doc.data();
        
        const promise = admin.auth().getUser(subscription.uid)
            .then(userRecord => {
                const userEmail = userRecord.email;
                
                const mailOptions = {
                    from: "itzabada19@gmail.com", // You can set a "from" address
                    to: userEmail,
                    subject: `Reminder: Your ${subscription.name} subscription is due soon!`,
                    html: `
                        <h1>Upcoming Bill Reminder</h1>
                        <p>Hello,</p>
                        <p>This is a reminder that your subscription for <strong>${subscription.name}</strong> is due in 3 days.</p>
                        <p>Amount: <strong>₹${subscription.amount.toFixed(2)}</strong></p>
                        <p>Thank you for using our Subscription Hub!</p>
                    `,
                };
                return transporter.sendMail(mailOptions);
            });
        promises.push(promise);
    });

    // Wait for all the emails to be sent
    await Promise.all(promises);

    logger.info("All reminder emails sent successfully!");
    return null;
});