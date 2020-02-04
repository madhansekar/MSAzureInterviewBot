// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { MessageFactory } = require('botbuilder');
const axio =require('axios');
const {
    AttachmentPrompt,
    ChoiceFactory,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,
    NumberPrompt,
    TextPrompt,
    WaterfallDialog
} = require('botbuilder-dialogs');
const { channels } = require('botbuilder-dialogs/lib/choices/channel');
const { UserProfile } = require('../userProfile');
const {DataService}=require('../services/dataservice.js')
const { QuestionsDialog } = require('./QuestionsDialog');

const ATTACHMENT_PROMPT = 'ATTACHMENT_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const NAME_PROMPT = 'NAME_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const EMAIL_PROMT='EMAIL_PROMPT'
const QUESTION_DIALOG='QUESTIONDIALOG'

class UserProfileDialog extends ComponentDialog {
    constructor(userState) {
        super('userProfileDialog');

        this.userProfile = userState.createProperty(USER_PROFILE);
        this.dataService=new DataService();
        this.data={};

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new TextPrompt(EMAIL_PROMT))
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT,this.phonenumberPromptValidator));
        this.addDialog(new AttachmentPrompt(ATTACHMENT_PROMPT, this.picturePromptValidator));
        this.addDialog(new QuestionsDialog(QUESTION_DIALOG,[]));



        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),


            this.nameConfirmStep.bind(this),
            this.phoneNumberStep.bind(this) ,
            this.emailStep.bind(this),
            this.topicStep.bind(this),
            this.subTopicStep.bind(this),
            this.levelStep.bind(this),
            this.qustionCollection.bind(this),
            //this.questionDisplayDialog.bind(this),

            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async transportStep(step) {
        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        // Running a prompt here means the next WaterfallStep will be run when the user's response is received.
        return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please enter your mode of transport.',
            choices: ChoiceFactory.toChoices(['Car', 'Bus', 'Bicycle'])
        });
    }

    async nameStep(step) {
        this.data=  await this.dataService.getData()

        return await step.prompt(NAME_PROMPT, 'Please enter your name.');
    }

    async nameConfirmStep(step) {
        step.values.name = step.result;

        // We can send messages to the user at any point in the WaterfallStep.
        await step.context.sendActivity(`Thanks ${ step.result }.`);
        const promptOptions = { prompt: 'Please Enter Your  Phone Number', retryPrompt: 'The value entered must  have length  10' };

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is a Prompt Dialog.
        return await step.prompt(NUMBER_PROMPT, promptOptions);
    }

    async phoneNumberStep(step) {
        step.values.phoneNumber = step.result;
        return await step.prompt(NAME_PROMPT, 'Please enter your email.')
    }

    async emailStep(step) {
        step.values.email = step.result;

          return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please Choose your gender.',
            choices: ChoiceFactory.toChoices(['Male', 'Female'])
        })
    }
    async topicStep(step) {
        step.values.gender = step.result.value;
        this.topicNames=this.data.topics.filter((x)=>x.topicName).map((x)=>x.topicName)

          return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please Choose your topic.',
            choices: ChoiceFactory.toChoices( this.topicNames)
        })
    }
    async subTopicStep(step) {
        step.values.topicName = step.result.value;
        let topicID=this.data.topics.find((x)=>x.topicName==step.values.topicName).topicId
        step.values.topicID= topicID;

        this.subTopicNames=this.data.subTopics.filter((x)=>x.topicId==topicID).map((x)=>x.subTopicName)

          return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please Choose your sub topic.',
            choices: ChoiceFactory.toChoices( this.subTopicNames)
        })
    }
    async levelStep(step) {
        step.values.subTopicName = step.result.value;
        let subTopicID=this.data.subTopics.find((x)=>x.subTopicName==step.values.subTopicName).subTopicId
        step.values.subTopicID= subTopicID;
        this.levels=this.data.levels.map((x)=>x.description)

          return await step.prompt(CHOICE_PROMPT, {
            prompt: 'Please Choose your level.',
            choices: ChoiceFactory.toChoices( this.levels)
        })
    }
    async qustionCollection(step){
        step.values.levelName = step.result.value;
        let levelId=this.data.levels.find((x)=>x.description==step.values.levelName).levelId
        step.values.levelId= levelId;
        step.values.questions=  await this.dataService.getQuestions(step.values.subTopicID,levelId)

        return await step.beginDialog(QUESTION_DIALOG, step.values.questions);




    }







    async summaryStep(step) {
        step.values.questions = step.result.values
        let question =step.values.questions.find((x)=>x.selectedAnswer=='')

        if (!question) {
            // Get the current profile object from user state.
            const userProfile = await this.userProfile.get(step.context, new UserProfile());

            userProfile.gender = step.result.value;
            userProfile.name = step.values.name;
            userProfile.email = step.values.email;
            userProfile.phoneNumber = step.values.phoneNumber;
            userProfile.subTopicId=step.values.subTopicID;
            userProfile.levelId=step.values.levelId;
            userProfile.questions=step.values.questions


           let user= await this.dataService.saveUser(userProfile)


            await step.context.sendActivity('Thanks. Your results will be shared soon');
            console.log("printed")
            return await step.endDialog();


        }

        // WaterfallStep always finishes with the end of the Waterfall or with another dialog; here it is the end.
        //return await step.endDialog();
    }

    async phonenumberPromptValidator(promptContext) {
        // This condition is our validation rule. You can also change the value at this point.
        return promptContext.recognized.succeeded && promptContext.recognized.value.toString().length==10;
    }


}

module.exports.UserProfileDialog = UserProfileDialog;
