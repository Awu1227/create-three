import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import minimist from "minimist";
import prompts from "prompts";
import { blue, cyan, red, reset, yellow } from "kolorist";
import {
  copy,
  emptyDir,
  formatTargetDir,
  isEmpty,
  isValidPackageName,
  toValidPackageName,
} from "./utils";
const argv = minimist<{
  t?: string;
  template?: string;
}>(process.argv.slice(2), { string: ["_"] });

const cwd = process.cwd();
const defaultTargetDir = "three-project";
type ColorFunc = (str: string | number) => string;
type Framework = {
  name: string;
  display: string;
  color: ColorFunc;
  variants: FrameworkVariant[];
};
type FrameworkVariant = {
  name: string;
  display: string;
  color: ColorFunc;
  customCommand?: string;
};
const FRAMEWORKS: Framework[] = [
  {
    name: "vanilla",
    display: "Vanilla",
    color: yellow,
    variants: [
      {
        name: "vanilla-ts",
        display: "TypeScript",
        color: blue,
      },
      {
        name: "vanilla",
        display: "JavaScript",
        color: yellow,
      },
    ],
  },

  {
    name: "react",
    display: "React-Three-Fiber",
    color: cyan,
    variants: [
      {
        name: "react-three-fiber-ts",
        display: "TypeScript",
        color: blue,
      },
      {
        name: "react-three-fiber",
        display: "JavaScript",
        color: yellow,
      },
    ],
  },
];

const TEMPLATES = FRAMEWORKS.map(
  (f) => (f.variants && f.variants.map((v) => v.name)) || [f.name]
).reduce((a, b) => a.concat(b), []);
const renameFiles: Record<string, string | undefined> = {
  _gitignore: ".gitignore",
};
async function init() {
  const argTargetDir = formatTargetDir(argv._[0]);
  const argTemplate = argv.template || argv.t;
  let targetDir = argTargetDir || defaultTargetDir;
  const getProjectName = () =>
    targetDir === "." ? path.basename(path.resolve()) : targetDir;
  prompts.override({
    overwrite: argv.overwrite,
  });

  let result: prompts.Answers<
    "packageName" | "overwrite" | "variant" | "framework"
  >;

  try {
    result = await prompts([
      {
        type: argTargetDir ? null : "text",
        name: "projectName",
        message: reset("Project name:"),
        initial: defaultTargetDir,
        onState: (state) => {
          targetDir = formatTargetDir(state.value) || defaultTargetDir;
        },
      },
      {
        type: () =>
          !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "select",
        name: "overwrite",
        message: () =>
          (targetDir === "."
            ? "Current directory"
            : `Target directory "${targetDir}"`) +
          ` is not empty. Please choose how to proceed:`,
        initial: 0,
        choices: [
          {
            title: "Remove existing files and continue",
            value: "yes",
          },
          {
            title: "Cancel operation",
            value: "no",
          },
          {
            title: "Ignore files and continue",
            value: "ignore",
          },
        ],
      },
      {
        type: (_, { overwrite }: { overwrite?: string }) => {
          if (overwrite === "no") {
            throw new Error(red("✖") + " Operation cancelled");
          }
          return null;
        },
        name: "overwriteChecker",
      },
      {
        type: () => (isValidPackageName(getProjectName()) ? null : "text"),
        name: "packageName",
        message: reset("Package name:"),
        initial: () => toValidPackageName(getProjectName()),
        validate: (dir) =>
          isValidPackageName(dir) || "Invalid package.json name",
      },
      {
        type: argTemplate && TEMPLATES.includes(argTemplate) ? null : "select",
        name: "framework",
        message:
          typeof argTemplate === "string" && !TEMPLATES.includes(argTemplate)
            ? reset(
                `"${argTemplate}" isn't a valid template. Please choose from below: `
              )
            : reset("Select a framework:"),
        initial: 0,
        choices: FRAMEWORKS.map((framework) => {
          const frameworkColor = framework.color;
          return {
            title: frameworkColor(framework.display || framework.name),
            value: framework,
          };
        }),
      },
      {
        type: (framework: Framework) =>
          framework && framework.variants ? "select" : null,
        name: "variant",
        message: reset("Select a variant:"),
        choices: (framework: Framework) =>
          framework.variants.map((variant) => {
            const variantColor = variant.color;
            return {
              title: variantColor(variant.display || variant.name),
              value: variant.name,
            };
          }),
      },
    ]);
    const { packageName, overwrite, variant, framework } = result;
    const root = path.join(cwd, targetDir);

    if (overwrite === "yes") {
      // 清空已有目录生成项目
      emptyDir(root);
    } else if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }

    // determine template
    let template: string = variant || framework?.name || argTemplate;

    const templateDir = path.resolve(
      fileURLToPath(import.meta.url),
      "../..",
      `template-${template}`
    );
    if (template === "vanilla-ts") {
      console.log(
        "ts version is currently not supported, so now use js version instead"
      );
    }
    const write = (file: string, content?: string) => {
      const targetPath = path.join(root, renameFiles[file] ?? file);
      if (content) {
        fs.writeFileSync(targetPath, content);
      } else {
        copy(path.join(templateDir, file), targetPath);
      }
    };

    const files = fs.readdirSync(templateDir);
    for (const file of files.filter((f) => f !== "package.json")) {
      write(file);
    }

    const pkg = JSON.parse(
      fs.readFileSync(path.join(templateDir, `package.json`), "utf-8")
    );

    pkg.name = packageName || getProjectName();

    write("package.json", JSON.stringify(pkg, null, 2) + "\n");
    const cdProjectName = path.relative(cwd, root);
    console.log(`\nDone🎉. Now run:\n`);
    if (root !== cwd) {
      console.log(
        `  cd ${
          cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName
        }`
      );
    }
    console.log(`  npm install`);
    console.log(`  npm run dev`);
  } catch (error) {}
}

init().catch((e) => {
  console.error(e);
});
