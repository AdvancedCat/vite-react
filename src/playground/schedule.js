import {
    unstable_scheduleCallback as scheduleCallback,
    unstable_IdlePriority as IdlePriority,
    unstable_LowPriority as LowPriority,
    unstable_NormalPriority as NormalPriority,
    unstable_UserBlockingPriority as UserBlockingPriority,
    unstable_ImmediatePriority as ImmediatePriority,
} from '../react-dist/scheduler';

function printA(didTimeout) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < 7) {}
    console.log('A didTimeout: ', didTimeout);
}
function printB(didTimeout) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < 3) {}
    console.log('B didTimeout: ', didTimeout);
}
function printC(didTimeout) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < 4) {}
    console.log('C didTimeout: ', didTimeout);
}
function printD(didTimeout) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < 7) {}
    console.log('D didTimeout: ', didTimeout);
}
function printE(didTimeout) {
    const start = new Date().getTime();
    while (new Date().getTime() - start < 10) {}
    console.log('E didTimeout: ', didTimeout);
}

scheduleCallback(IdlePriority, printA);
scheduleCallback(LowPriority, printB);
scheduleCallback(NormalPriority, printC);
scheduleCallback(UserBlockingPriority, printD);
scheduleCallback(ImmediatePriority, printE);
