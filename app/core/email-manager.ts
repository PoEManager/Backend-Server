import Joi from '@hapi/joi';
import base64url from 'base64-url';
import fs from 'fs';
import Handlebars from 'handlebars';
import juice from 'juice';
import nodemailer from 'nodemailer';
import path from 'path';
import JSONLoader from '../core/load-json';
import errors from '../model/errors';
import User from '../model/user';
import UserManager from '../model/user-manager';
import config from './config';
import coreErrors from './errors';
import RootDirectory from './root-directory';

namespace EmailManager {
    const VERIFICATION_ROUTE_PATH = 'users/verification';

    /**
     * A promise wrapper for `juice.juiceResources()`.
     *
     * @param inHtml The input HTML.
     * @param options Inlining options.
     *
     * @returns The inlined HTML.
     */
    async function juiceResources(inHtml: string, options: juice.Options): Promise<string> {
        return new Promise((resolve, reject) => {
            juice.juiceResources(inHtml, options, (error, html) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(html);
                }
            });
        });
    }

    /**
     * Generates a verification link for the passed change UID.
     * The base URL is `config.basic.baseURL`.
     *
     * @param changeUid The change UID of the verification link.
     * @returns The link.
     */
    function makeVerificationLink(changeUid: string): string {
        return `${config.basic.baseURL}/${config.basic.basePath}/` +
            `${VERIFICATION_ROUTE_PATH}/${base64url.escape(changeUid)}`;
    }

    /**
     * Sends a verification E-Mail to a specific user.
     *
     * @param user The user to send the link to.
     */
    export async function sendVerificationMail(user: User): Promise<void> {
        await sendGenericEmail(user, User.ChangeType.VERIFY_ACCOUNT, 'verification');
    }

    /**
     * Sends an E-Mail to a specific user to verify their new E-Mail.
     *
     * @param user The user to send the link to.
     */
    export async function sendEmailVerificationMail(user: User): Promise<void> {
        await sendGenericEmail(user, User.ChangeType.NEW_EMAIL, 'email-verification');
    }

    /**
     * Sends an E-Mail to a specific user to verify their new password.
     *
     * @param user The user to send the link to.
     */
    export async function sendPasswordVerificationMail(user: User): Promise<void> {
        await sendGenericEmail(user, User.ChangeType.NEW_PASSWORD, 'password-verification');
    }

    /**
     * A generic function that sends verification E-Mails.
     *
     * @param user The user that the E-Mail is for.
     * @param desiredChangeState The change state that is required.
     * @param mailConfig The E-Mail configuration.
     * @param makeLink A function that generates the verification link.
     */
    async function sendGenericEmail(user: User, desiredChangeState: User.ChangeType, mailConfig: string):
        Promise<void> {

        const currentChangeState = await user.getChangeState();

        if (currentChangeState !== desiredChangeState) {
            throw new errors.InvalidChangeState(currentChangeState, desiredChangeState);
        }

        const result = await user.query([
            User.QueryData.NICKNAME,
            User.QueryData.DEFAULT_LOGIN_ID,
            User.QueryData.CHANGE_UID
        ]);

        const email = await (await UserManager.getDefaultLogin(result.defaultLoginId!)).getEmail();
        const link = makeVerificationLink(result.changeUid!);

        await sendPredefinedMail(mailConfig, email, {
                nickname: result.nickname,
                email,
                link
            });
    }

    /**
     * Send an email according to a specific configuration.
     *
     * @param configName The name of the E-Mail configuration.
     * @param to The recipient.
     * @param context The context that will be used to generate the E-Mail HTML from the template.
     *
     * @throws **InvalidEMailConfigurationError** The E-Mail configuration file is invalid.
     * @throws **EmailSendError** The E-Mail could not be sent.
     */
    async function sendPredefinedMail(configName: string, to: string, context: any): Promise<void> {
        let emailConfig: {template: string, subject: string};

        try {
            emailConfig = await JSONLoader.loadJSON(path.join(await getEmailDir(), `${configName}.json`));

            const schema = Joi.object({
                template: Joi.string().required(),
                subject: Joi.string().required()
            });

            await schema.validate(emailConfig);
        } catch (error) {
            throw new coreErrors.InvalidEmailConfigurationError(configName);
        }

        context.subject = emailConfig.subject;
        const content = await compileHandlebars(emailConfig.template, context);
        const inlinedContent = await juiceResources(content, {
            webResources: {
                relativeTo: 'res'
            }
        });

        try {
            await sendMail(to, emailConfig.subject, inlinedContent);
        } catch (error) {
            throw new coreErrors.EmailSendError(to);
        }
    }

    /**
     * Compile a handlebars template and generate HTML from it.
     *
     * @param file The path to the file that will be compiled.
     * @param context The context.
     *
     * @returns The generated HTML.
     */
    async function compileHandlebars(file: string, context: any): Promise<string> {
        let template;

        try {
            const rawContent = await fs.promises.readFile(path.join(await getEmailDir(), file), 'utf-8');
            template = Handlebars.compile(rawContent);
        } catch (error) {
            throw new coreErrors.TemplateCompileError(file);
        }

        try {
            return template(context);
        } catch (error) {
            throw new coreErrors.HTMLGenerationError(file);
        }
    }

    /**
     * Sends an E-Mail to a recipient.
     *
     * The sender is defined in `config.email`.
     *
     * @param to The recipient.
     * @param subject The E-Mail subject.
     * @param content The HTML.
     */
    async function sendMail(to: string, subject: string, content: string): Promise<void> {
        const transport = nodemailer.createTransport({
            host: config.email.host,
            auth: {
                user: config.email.auth.user,
                pass: config.email.auth.password
            }
        });

        await transport.sendMail({
            from: config.email.sender,
            to,
            subject,
            html: content
        });
    }

    /**
     * @returns The directory in which the E-Mail configurations reside.
     */
    async function getEmailDir(): Promise<string> {
        return path.join(await RootDirectory.get(), 'res', 'email');
    }
}

export = EmailManager;
