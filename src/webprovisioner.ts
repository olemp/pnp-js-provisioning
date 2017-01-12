// we need to import HandlerBase & TypedHash to avoid naming issues in ts transpile
import { Schema } from "./schema";
import { HandlerBase } from "./handlers/handlerbase";
import { TypedHash, Web, Logger, LogLevel } from "sp-pnp-js";
import { DefaultHandlerMap, DefaultHandlerSort } from "./handlers/exports";

/**
 * Root class of Provisioning 
 */
export class WebProvisioner {

    /**
     * Creates a new instance of the Provisioner class
     * 
     * @param web The Web instance to which we want to apply templates
     * @param handlermap A set of handlers we want to apply. The keys of the map need to match the property names in the template
     */
    constructor(
        private web: Web,
        public handlerMap: TypedHash<HandlerBase> = DefaultHandlerMap,
        public handlerSort: TypedHash<number> = DefaultHandlerSort) { }

    /**
     * Applies the supplied template to the web used to create this Provisioner instance
     * 
     * @param template The template to apply
     */
    public applyTemplate(template: Schema): Promise<void> {

        Logger.write(`Beginning processing of web [${this.web.toUrl()}]`, LogLevel.Info);

        // keeping this broken allows for easier debugging of the incoming tasks + ordering
        let operations = Object.getOwnPropertyNames(template).sort((name1: string, name2: string) => {

            let sort1 = this.handlerSort.hasOwnProperty(name1) ? this.handlerSort[name1] : 99;
            let sort2 = this.handlerSort.hasOwnProperty(name2) ? this.handlerSort[name2] : 99;

            return sort1 - sort2;
        });

        // reduce those operations to a promise chain and return that. When this chain resolves the site is provisioned
        return operations.reduce((chain, name) => {

            let handler = this.handlerMap[name];

            return chain.then(_ => handler.ProvisionObjects(this.web, template[name]));

        }, Promise.resolve()).then(_ => {

            Logger.write(`Done processing of web [${this.web.toUrl()}]`, LogLevel.Info);
        });
    }
}
