import { createRequire } from 'module';
import { glob } from 'glob';
const require=createRequire(import.meta.url);
const Ajv=require('ajv');
const addFormats=require('ajv-formats');
const schema=require('./audits/schema/audit-output.schema.json');
const ajv=new Ajv({allErrors:true});
addFormats(ajv);
const files=await glob('audits/runs/**/*.json');
for (const file of files) {
  const data=require(`./${file}`);
  const valid=ajv.validate(schema,data);
  if(!valid){
    console.log(file,'INVALID');
    console.log(ajv.errors);
  }
}
