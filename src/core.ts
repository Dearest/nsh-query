// The only module that imports query-core. focusManager, onlineManager and
// notifyManager are module singletons: a second copy of query-core would
// leave the platform wiring connected to the wrong one.
export * from "../vendor/query-core/index.js";
