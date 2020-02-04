// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler } = require('botbuilder');
const WELCOMED_USER = 'welcomedUserProperty';

class DialogBot extends ActivityHandler {
    /**
     *
     * @param {ConversationState} conversationState
     * @param {UserState} userState
     * @param {Dialog} dialog
     */
    constructor(conversationState, userState, dialog) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');
         // See https://aka.ms/about-bot-state-accessors to learn more about the bot state and state accessors.
         this.welcomedUserProperty = userState.createProperty(WELCOMED_USER);

         this.userState = userState;

         this.onMessage(async (context, next) => {
             // Read UserState. If the 'DidBotWelcomedUser' does not exist (first time ever for a user)
             // set the default to false.
             const didBotWelcomedUser = await this.welcomedUserProperty.get(context, false);

             // Your bot should proactively send a welcome message to a personal chat the first time
             // (and only the first time) a user initiates a personal chat with your bot.
             if (didBotWelcomedUser === false) {
                 // The channel should send the user name in the 'From' object
                 const userName = context.activity.from.name;


                 // Set the flag indicating the bot handled the user's first message.
                 await this.welcomedUserProperty.set(context, true);
             }
             // Save state changes
             await this.userState.saveChanges(context);
             console.log('Running dialog with Message Activity.');

             // Run the Dialog with the new message Activity.
             await this.dialog.run(context, this.dialogState);
             // By calling next() you ensure that the next BotHandler is run.
             await next();
         });

         // Sends welcome messages to conversation members when they join the conversation.
         // Messages are only sent to conversation members who aren't the bot.
         this.onMembersAdded(async (context, next) => {
             // Iterate over all new members added to the conversation
             for (const idx in context.activity.membersAdded) {
                 // Greet anyone that was not the target (recipient) of this message.
                 // Since the bot is the recipient for events from the channel,
                 // context.activity.membersAdded === context.activity.recipient.Id indicates the
                 // bot was added to the conversation, and the opposite indicates this is a user.
                 if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
                     await context.sendActivity('Welcome to EY . ');
                     await context.sendActivity("This bot will introduce you to user Registration and interview process");

                 }
             }
             await this.dialog.run(context, this.dialogState);
             // By calling next() you ensure that the next BotHandler is run.
             await next();
         });



        this.onDialog(async (context, next) => {
            // Save any state changes. The load happened during the execution of the Dialog.
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
            await next();
        });
    }
}

module.exports.DialogBot = DialogBot;
