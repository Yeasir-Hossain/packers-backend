import ejs from 'ejs';


/**
 * Function @param generateMailTemplate send mail template with the options
 * @param file is the ejs file
 * @param options is the options that need to be passed to the ejs file
 * @returns the generated email template
 */
export default function generateMailTemplate(file, options) {
  return ejs.render(file, options);
}