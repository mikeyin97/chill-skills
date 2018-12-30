const Alexa = require('ask-sdk-core');

const GetNewFactHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    // checks request type
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetNewFactIntent');
  },
  handle(handlerInput) {
    var fact = catData["FACTS"][Math.floor(Math.random() * catData["FACTS"].length)];
    var factMsg = catData["GET_FACT_MESSAGE"][Math.floor(Math.random() * catData["GET_FACT_MESSAGE"].length)];
    const speakOutput = factMsg + fact;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .withSimpleCard(catData["SKILL_NAME"], fact)
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
      .speak(catData['HELP_MESSAGE'])
      .reprompt(catData['HELP_REPROMPT'])
      .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(catData['FALLBACK_MESSAGE'])
      .reprompt(catData['FALLBACK_REPROMPT'])
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
      .speak(catData['STOP_MESSAGE'])
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
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
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    return handlerInput.responseBuilder
      .speak(catData['ERROR_MESSAGE'])
      .reprompt(catData['ERROR_MESSAGE'])
      .getResponse();
  },
};


const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewFactHandler,
    HelpHandler,
    ExitHandler,
    FallbackHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

// cat facts from https://www.purina.com.au/cats/care/facts
const catData = {
  "WELCOME_MESSAGE": 'Welcome to Quick Cat Facts!',
  "SKILL_NAME": 'Cat Facts',
  "GET_FACT_MESSAGE": [
      'Did you know ',
      'Your cat fact is '
  ],
  "HELP_MESSAGE": 'Please say tell me a cat fact or exit',
  "HELP_REPROMPT": 'What do you need help with?',
  "FALLBACK_MESSAGE": 'I do not understand',
  "FALLBACK_REPROMPT": 'What do you need help with',
  "ERROR_MESSAGE": 'An error occurred.',
  "STOP_MESSAGE": 'Sayonara',
  "FACTS":
    [
      'cats have been domesticated for around 4,000 years. While they were once valued for their hunting abilities, they are now valued for their companionship and loving behaviour.',
      'while not well known, the collective nouns used for cats and kittens are a clowder of cats and a kindle of kittens.',
      'our domestic cats are known as little cats. They differ from large cats such as lions and tigers because they are naturally active at night and can purr.',
      'cats are now the most popular pet in the UK and in the US.',
      'cats have 30 teeth (dogs have 42) and most of us know how sharp they are!',
      'more cats are left-pawed than right.',
      'cats can retract their front claws. This keeps them sharp so they can be used for climbing and of course, as effective weapons!',
      'cats can travel at speeds of up to 30km per hour.',
      'cats need to interact with people from two weeks of age to enable them to be social towards humans. After 16 weeks of age it is very difficult to tame a cat.',
      'cats are believed to be the only mammals who don\'t taste sweetness.',
      'cats are nearsighted, but their peripheral vision and night vision are much better than that of humans.',
      'cats can jump up to six times their length.',
      'cats\' claws all curve downward, which means that they cannot climb down trees head-first. Instead, they have to back down the trunk.',
      'cats\' collarbones don\'t connect to their other bones, as these bones are buried in their shoulder muscles.',
      'cats have 230 bones, while humans only have 206.',
      'cats have an extra organ that allows them to taste scents on the air, which is why your cat stares at you with her mouth open from time to time.',
      'cats have whiskers on the backs of their front legs, as well.',
      'cats have nearly twice the amount of neurons in their cerebral cortex as dogs.',
      'cats have the largest eyes relative to their head size of any mammal.',
      'cats make very little noise when they walk around. The thick, soft pads on their paws allow them to sneak up on their prey -- or you!',
      'cats\' rough tongues can lick a bone clean of any shred of meat.',
      'cats use their long tails to balance themselves when they\'re jumping or walking along narrow ledges.'
    ]
};
