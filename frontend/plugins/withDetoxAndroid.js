const fs = require('fs');
const path = require('path');
const {
  createRunOncePlugin,
  withAppBuildGradle,
  withDangerousMod,
  withProjectBuildGradle,
} = require('@expo/config-plugins');

const DETOX_MAVEN_REPO = `maven { url("$rootDir/../node_modules/detox/Detox-android") }`;
const DEFAULT_CONFIG_LINES = [
  `testBuildType System.getProperty('testBuildType', 'debug')`,
  `testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'`,
];
const DETOX_TEST_DEPENDENCIES = [
  `androidTestImplementation('com.wix:detox:+')`,
  `androidTestImplementation('androidx.test:runner:1.6.2')`,
  `androidTestImplementation('androidx.test:rules:1.6.1')`,
  `androidTestImplementation('androidx.test.ext:junit:1.2.1')`,
];

function findBlockRange(contents, blockName) {
  const blockRegex = new RegExp(`(^[ \\t]*)${blockName}\\s*\\{`, 'm');
  const match = blockRegex.exec(contents);
  if (!match) return null;

  const start = match.index;
  const indent = match[1] ?? '';
  const openIndex = contents.indexOf('{', start);
  if (openIndex < 0) return null;

  let depth = 0;
  for (let i = openIndex; i < contents.length; i += 1) {
    const ch = contents[i];
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth === 0) {
      return { start, end: i, indent };
    }
  }

  return null;
}

function ensureLinesInBlock(contents, blockName, lines) {
  const range = findBlockRange(contents, blockName);
  if (!range) return contents;

  const block = contents.slice(range.start, range.end + 1);
  const closeIndex = block.lastIndexOf('}');
  const childIndent = `${range.indent}    `;
  const missing = lines.filter((line) => !block.includes(line));
  if (missing.length === 0) return contents;

  const insertion = `${missing.map((line) => `\n${childIndent}${line}`).join('')}\n${range.indent}`;
  const patchedBlock = `${block.slice(0, closeIndex)}${insertion}}`;

  return `${contents.slice(0, range.start)}${patchedBlock}${contents.slice(range.end + 1)}`;
}

function ensureProjectBuildGradle(contents) {
  if (contents.includes(DETOX_MAVEN_REPO)) {
    return contents;
  }

  const allProjectsRange = findBlockRange(contents, 'allprojects');
  if (!allProjectsRange) {
    return contents;
  }

  const allProjectsBlock = contents.slice(allProjectsRange.start, allProjectsRange.end + 1);
  const patchedAllProjects = ensureLinesInBlock(allProjectsBlock, 'repositories', [DETOX_MAVEN_REPO]);

  if (patchedAllProjects === allProjectsBlock) {
    return contents;
  }

  return `${contents.slice(0, allProjectsRange.start)}${patchedAllProjects}${contents.slice(allProjectsRange.end + 1)}`;
}

function ensureAppBuildGradle(contents) {
  let next = ensureLinesInBlock(contents, 'defaultConfig', DEFAULT_CONFIG_LINES);
  next = ensureLinesInBlock(next, 'dependencies', DETOX_TEST_DEPENDENCIES);
  return next;
}

function createDetoxTestJava(packageName) {
  return `package ${packageName};

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
  @Rule
  public ActivityTestRule<MainActivity> activityRule =
      new ActivityTestRule<>(MainActivity.class, false, false);

  @Test
  public void runDetoxTests() {
    Detox.runTests(activityRule, new DetoxConfig());
  }
}
`;
}

const withDetoxAndroid = (config) => {
  config = withProjectBuildGradle(config, (cfg) => {
    cfg.modResults.contents = ensureProjectBuildGradle(cfg.modResults.contents);
    return cfg;
  });

  config = withAppBuildGradle(config, (cfg) => {
    cfg.modResults.contents = ensureAppBuildGradle(cfg.modResults.contents);
    return cfg;
  });

  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const packageName = cfg.android?.package ?? 'com.surveyopsplus.frontend';
      const packagePath = packageName.split('.');
      const targetDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'androidTest',
        'java',
        ...packagePath
      );
      const targetFile = path.join(targetDir, 'DetoxTest.java');

      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetFile, createDetoxTestJava(packageName));
      return cfg;
    },
  ]);

  return config;
};

module.exports = createRunOncePlugin(withDetoxAndroid, 'with-detox-android', '1.0.0');
