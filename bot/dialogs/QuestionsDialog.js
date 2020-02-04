const { ActivityTypes } = require('botbuilder');
const { ChoiceFactory,ListStyle,
    ChoicePrompt,
    ComponentDialog,
    ConfirmPrompt,
    DialogSet,
    DialogTurnStatus,Dialog } = require('botbuilder-dialogs');
const CHOICE_PROMPT = 'CHOICE_PROMPT';
class QuestionsDialog extends Dialog {
    constructor(dialogId,questions ) {
        super(dialogId);

    }

    async beginDialog(dc,questions) {
        if (dc.context.activity.type !== ActivityTypes.Message) {
            return Dialog.EndOfTurn;
        }
        dc.activeDialog.state.values=questions;

        // Call runPrompt, which will find the next slot to fill.
        return await this.runPrompt(dc);
    }

    async continueDialog(dc) {
        // Skip non-message activities.
        if (dc.context.activity.type !== ActivityTypes.Message) {
            return Dialog.EndOfTurn;
        }

        // Call runPrompt, which will find the next slot to fill.
        return await this.runPrompt(dc);
    }

     async resumeDialog(dc, reason, result) {
        // dialogResume is called whenever a prompt or child-dialog completes
        // and the parent dialog resumes.  Since every turn of a SlotFillingDialog
        // is a prompt, we know that whenever we resume, there is a value to capture.



    //     // Move on to the next slot in the dialog.
        let question=  dc.activeDialog.state.values.find((x)=>x.id==this.activeQuestion.id)
        question.selectedAnswer=result.value

        return await this.runPrompt(dc);
    }

    async runPrompt(dc) {
        // runPrompt finds the next slot to fill, then calls the appropriate prompt to fill it.
        const state = dc.activeDialog.state;


        let question =state.values.find((x)=>x.selectedAnswer=='')
        this.activeQuestion=question

       if(question){
        return await dc.prompt(CHOICE_PROMPT, {
            prompt: question.question,
            choices: question.choices,
            style : ListStyle.heroCard
        })


       }else{
        return await dc.endDialog(dc.activeDialog.state);
       }





    }

}
module.exports.QuestionsDialog = QuestionsDialog;