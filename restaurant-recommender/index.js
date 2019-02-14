const Alexa = require('ask-sdk-core');
const apiKey //= insert your own apiKey here
var request = require('request');

/* INTENT HANDLERS */

// upon initial launch of the skill
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Welcome to restaurant picker! I can help you pick a restaurant.')
      .reprompt('Try saying, pick a restaurant for me.')
      .getResponse();
  },
};

const InProgressRestaurantPickerIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && request.intent.name === 'RestaurantPickerIntent'
      && request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    // delegateDirective essentially means that, if the dialog is not complete, alexa will select
    // an appropriate next step from the dialog model
    return handlerInput.responseBuilder
        .addDelegateDirective(currentIntent)
        .getResponse();
  }
};

  
const CompletedRestaurantPickerIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'RestaurantPickerIntent';
    },
    async handle(handlerInput) {
        // async indicates an asynchronous piece of code that ALWAYS returns a promise
        console.log("Start");
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(filledSlots);
        var finalOutput = "";
        var url = 'http://api.yelp.com/v3/businesses/search?term=restaurant';
        var cuisine = String(slotValues.cuisine.resolved).toLowerCase().split(' ').join('+');
        var opennow = String(slotValues.opennow.resolved).toLowerCase().split(' ').join('+');
        var price = String(slotValues.price.resolved).toLowerCase().split(' ').join('+');
        var location = String(slotValues.location.resolved).toLowerCase().split(' ').join('+');

        if (cuisine !== "any") {
          url += "+";
          url += cuisine;
        }

        if (opennow === "yes") {
          url += "&open_now=true";
        }

        if (price !== "any") {
          url += "&price=";
          if (price == "cheap"){
            url += "1";
          } else if (price == "medium"){
            url += "2";
          } else {
            url += "3,4";
          }
        }

        url += "&location=";
        url += location;

        // in this promise, we make a request to the constructed yelp api.
        // after the response has been returned, we handle it and then resolve the promise
        // since at this point, all the code that needs to be run in the asyncronous executor has completed
        // and we finally resolve the promise. We need a promise because the get request needs to be 
        // completed before the next steps.
        return new Promise((resolve, reject) => {
          request.get(url, {
            'auth': {
              'bearer': apiKey
            }
          },(error,response, body) => {
            console.log(response.statusCode);
            body = JSON.parse(body);
            if (body["total"] === 0) {
              finalOutput += "Sorry, but no restaurants match your search criteria.";
            } else {
              var randomNum = Math.floor(Math.random() * Math.min(body["total"], 20));
              // Yelp API only goes up to 20 per page by default. (unless you change offset or limit)
              // if less than 20 items, we choose a random one from all the items.
              // if more than 20 items, we choose a random one from the first page (so from 0 to 19 inclusive).
              finalOutput += "Your suggested restaurant is ";
              finalOutput += body["businesses"][randomNum]["name"];
              finalOutput += " located at ";
              finalOutput += body["businesses"][randomNum]["location"]["address1"];

            }
            resolve(handlerInput.responseBuilder
              .speak(finalOutput)
              .getResponse());
          });
        })
        .catch((error) => {
            console.log(`Error in SetDefaultLocationIntent promise: ${error}`);
            console.log(error);
            finalOutput += "Sorry, an error occurred.";
            handlerInput.responseBuilder
              .speak(finalOutput)
              .getResponse();
        });

    },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Sorry I cannot help with that. Please try saying, pick a restaurant for me.')
      .reprompt('Try saying, pick a restaurant for me.')
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
      .speak('I can help you pick a restaurant. You can begin by saying, pick a restaurant for me.')
      .reprompt('I can help you pick a restaurant. You can begin by saying, pick a restaurant for me.')
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

// returns an object where each slotvalue has its synonym (the initial value of its type), if it successfully matched, and if it is validated
// will try to match all, but function can continue even if some do not match.
function getSlotValues(filledSlots) {
    const slotValues = {};

    console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
    Object.keys(filledSlots).forEach((item) => {
        const name = filledSlots[item].name;
        // name is the name of the slot (eg cuisine)
        if (filledSlots[item] &&
        filledSlots[item].resolutions &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
            case 'ER_SUCCESS_MATCH':
            slotValues[name] = {
                synonym: filledSlots[item].value, //the value of the slot
                resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name, //the default synonym it resolves to
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
    InProgressRestaurantPickerIntent,
    CompletedRestaurantPickerIntent,
    HelpHandler,
    FallbackHandler,
    ExitHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
