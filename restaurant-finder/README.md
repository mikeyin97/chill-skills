# Restaurant Recommender

<img src="https://i.imgur.com/RxZsSo4.jpg" />

No matter who I hang out with, it always seems as though we can never decide on what to eat. No one seems to ever want to make the final choice on a restaurant. I’ve had times where my friends and I have spent up to an hour deciding on a place to eat. 

To solve this problem, I designed the **Restaurant Recommender** skill to provide recommendations on where to eat based on given criteria. Just start up the skill with “Alexa, open restaurant recommender”, follow the instructions, and Alexa will recommend you a great restaurant!

For this project, I write my logic in node.js, host the function online on AWS Lambda, and use Yelp’s API to generate recommendations. 

You can find the production build of the project [here!](https://www.amazon.com/mile-Restaurant-Recommender/dp/B07MDVZ3Y6/)

## Table of Contents

1. [ Usage Guide ](#guide)
2. [ How Does it Work? ](#how)
3. [ Model ](#model)
4. [ Lambda Function ](#lambda)
5. [ Extensions ](#extensions)

<a name="guide"></a>
## Usage Guide

Here is an example of how to use Restaurant Recommender

<img src="https://i.imgur.com/oxZFkET.png" />
<img src="https://i.imgur.com/zkyg7hH.png" />

This is just one example! This skill is designed to be flexible with your utterances. For example, you can be as general as 

```Pick a restaurant for me```

to as specific as 

```Recommend me a cheap fast-food restaurant in Toronto```

**Note**: At any time, you can say `help` to get help or `quit` to exit the skill.

<a name="how"></a>
## How Does it Work?

<img src="https://i.imgur.com/fXKXq5A.png" />

<a name="model"></a>
## Model

<a name="lambda"></a>
## Lambda Function

<a name="extensions"></a>
## Extensions

