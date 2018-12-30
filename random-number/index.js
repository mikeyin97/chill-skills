const Alexa = require('ask-sdk-core');

/* INTENT HANDLERS */

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Welcome to random number generator! Give me two positive integers and I will give you a random integer between them!')
      .reprompt('Give me two integers and I will give you a random integer between them!')
      .getResponse();
  },
};

const InProgressRandomNumberIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'RandomNumberIntent'
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
  }
};

  
const CompletedRandomNumberIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'RandomNumberIntent';
    },
    handle(handlerInput) {
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(filledSlots);
        let randomVal = null;
        let speechOutput = 'Your random number between ';
        num1 = parseInt(String(slotValues.a.synonym),10)
        num2 = parseInt(String(slotValues.b.synonym),10)
        if (num1 > num2){
            var temp = num1;
            num1 = num2;
            num2 = temp;
        }
        speechOutput += String(num1);
        speechOutput += ' and ';
        speechOutput += String(num2);
        speechOutput += ' inclusive is ';
        randomVal = Math.floor(Math.random()*(num2-num1+1)) + num1;
        speechOutput += String(randomVal);


        return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
    },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Sorry I cannot help with that. Please state give me a random number between a and b where a and b are your integers!')
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Please say give me a random number between a and b, where a and b are two integers')
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Goodbye!')
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${handlerInput.requestEnvelope.request.type} ${handlerInput.requestEnvelope.request.type === 'IntentRequest' ? `intent: ${handlerInput.requestEnvelope.request.intent.name} ` : ''}${error.message}.`);

    return handlerInput.responseBuilder
      .speak('Sorry, I do not understand the command. Please say again.')
      .reprompt('Sorry, I do not understand the command. Please say again.')
      .getResponse();
  },
};


function getSlotValues(filledSlots) {
    const slotValues = {};

    console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
    Object.keys(filledSlots).forEach((item) => {
        const name = filledSlots[item].name;

        if (filledSlots[item] &&
        filledSlots[item].resolutions &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            case 'ER_SUCCESS_MATCH':
            slotValues[name] = {
                synonym: filledSlots[item].value,
                resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                isValidated: true,
            };
            break;
            case 'ER_SUCCESS_NO_MATCH':
            slotValues[name] = {
                synonym: filledSlots[item].value,
                resolved: filledSlots[item].value,
                isValidated: false,
            };
            break;
            default:
            break;
        }
        } else {
        slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].value,
            isValidated: false,
        };
        }
    }, this);

    return slotValues;
}


const skillBuilder = Alexa.SkillBuilders.custom();

/* LAMBDA SETUP */
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressRandomNumberIntent,
    CompletedRandomNumberIntent,
    HelpHandler,
    FallbackHandler,
    ExitHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();