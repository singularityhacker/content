const fs = require("fs");
const path = require("path");
const glob = require("glob");
const readingTime = require("reading-time");

const projectRoot = path.join(__dirname);

const logFilePath = path.join(projectRoot, "logfile.json");

glob("**/*.md", { ignore: ["**/node_modules/**", "**/README.md"] }, function (
  err,
  files
) {
  if (err) {
    throw new Error(err.message);
  }

  files.forEach((file) => {
    const logFileContent = fs.readFileSync(`${logFilePath}`, "utf8");
    const markdownFileContent = fs.readFileSync(`${file}`, "utf8");

    const initialWordCount = readingTime(markdownFileContent).words;

    const parsedFile = JSON.parse(logFileContent);
    const fileName = file.split(".")[0];

    const existingFileName = parsedFile[fileName];

    if (!existingFileName) {
      console.info(
        `'${fileName}' seems to be a new file, adding to wordCount.js log file...`
      );

      const newContent = {
        ...parsedFile,
        [fileName]: {
          initialWords: initialWordCount,
        },
      };

      fs.writeFileSync(logFilePath, JSON.stringify(newContent, null, 2));
    } else {
      const fileObjKeys = Object.keys(existingFileName);
      const latestTimestamp = fileObjKeys[fileObjKeys.length - 1];

      const currentWords = existingFileName[latestTimestamp].currentWords;

      const wordCountExisting =
        currentWords != null ? currentWords : existingFileName.initialWords;
      const wordCountNew = readingTime(markdownFileContent).words;

      const diffTimestamp = new Date().toISOString();
      const diffInWords = wordCountNew - wordCountExisting;

      if (diffInWords !== 0) {
        console.info(`Changes found in '${fileName}', creating diff...`);

        const updatingFileWithDiffContent = {
          ...parsedFile,
          [fileName]: {
            ...existingFileName,
            [diffTimestamp]: {
              diff: diffInWords,
              currentWords: wordCountNew,
            },
          },
        };

        fs.writeFileSync(
          logFilePath,
          JSON.stringify(updatingFileWithDiffContent, null, 2)
        );
      }
    }
  });
});
