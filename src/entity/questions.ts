import {ChildEntity} from 'typeorm';
import {Question} from './Question';

/*
https://www.duolingo.com/design/

"assemble", // "Tap" on Duolingo
"speak",
"translate",
"fill",
"match",
"select",
"assist",
"name",
"listen",
"judge",
"word-smash", // Duolingo clubs
"caption",
"scenario",
"listen-answer",
"use",
"club-chat"
*/

@ChildEntity()
export class SelectQuestion extends Question {}

@ChildEntity()
export class JudgeQuestion extends Question {}

@ChildEntity()
export class AssembleQuestion extends Question {}
