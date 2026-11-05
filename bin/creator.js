#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const prompts = require('prompts');

const SKILL_SOURCE = path.resolve(__dirname, '..', 'SKILL.md');
const REFERENCES_SOURCE = path.resolve(__dirname, '..', 'references');

function getHomeDir() {
  return os.homedir();
}

function copyDirectorySync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const TARGET_OPTIONS = [
  { title: '🪐 Antigravity / Gemini CLI', value: 'antigravity', selected: true, description: '~/.gemini/config/skills/omni-creator' },
  { title: '🟣 Claude Code', value: 'claude', description: '~/.claude/skills/omni-creator' },
  { title: '⚡ Cursor IDE', value: 'cursor', description: '.cursor/rules/omni-creator.mdc' },
  { title: '🌊 Windsurf', value: 'windsurf', description: '.windsurfrules' },
  { title: '📁 Projeto Local', value: 'local', description: './SKILL.md + references/' }
];

function printHelp() {
  console.log(`
✍️  OmniCreator — Universal Content Creation, Voice & High-Conversion Copywriting Engine

Usage:
  npx omni-creator install           Interactive multi-selection menu
  npx omni-creator install <targets> Direct install (e.g. npx omni-creator install antigravity claude)
  npx omni-creator print             Print the raw SKILL.md content to stdout
  npx omni-creator info              Show supported pillars and quick commands

Available Targets:
  antigravity  Installs to ~/.gemini/config/skills/omni-creator/ (SKILL.md + references/)
  claude       Installs to ~/.claude/skills/omni-creator/ (SKILL.md + references/)
  cursor       Creates .cursor/rules/omni-creator.mdc in current working directory
  windsurf     Appends rule to .windsurfrules in current working directory
  local        Copies SKILL.md and references/ into current working directory
  all          Installs into all supported environments
`);
}

function installToTarget(target) {
  if (!fs.existsSync(SKILL_SOURCE)) {
    console.error('Error: SKILL.md source file not found.');
    process.exit(1);
  }

  const skillContent = fs.readFileSync(SKILL_SOURCE, 'utf8');
  let destDir = '';
  let destFile = '';

  const normalized = target.toLowerCase();

  switch (normalized) {
    case 'antigravity':
    case 'gemini':
      destDir = path.join(getHomeDir(), '.gemini', 'config', 'skills', 'omni-creator');
      destFile = path.join(destDir, 'SKILL.md');
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destFile, skillContent, 'utf8');
      if (fs.existsSync(REFERENCES_SOURCE)) {
        copyDirectorySync(REFERENCES_SOURCE, path.join(destDir, 'references'));
      }
      console.log(`  ✓ [Antigravity] Instalado em: ${destDir}`);
      break;

    case 'claude':
      destDir = path.join(getHomeDir(), '.claude', 'skills', 'omni-creator');
      destFile = path.join(destDir, 'SKILL.md');
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destFile, skillContent, 'utf8');
      if (fs.existsSync(REFERENCES_SOURCE)) {
        copyDirectorySync(REFERENCES_SOURCE, path.join(destDir, 'references'));
      }
      console.log(`  ✓ [Claude Code] Instalado em: ${destDir}`);
      break;

    case 'cursor':
      destDir = path.join(process.cwd(), '.cursor', 'rules');
      destFile = path.join(destDir, 'omni-creator.mdc');
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destFile, skillContent, 'utf8');
      console.log(`  ✓ [Cursor IDE] Criado em: ${destFile}`);
      break;

    case 'windsurf':
      destFile = path.join(process.cwd(), '.windsurfrules');
      fs.appendFileSync(destFile, `\n\n# OmniCreator Skill\n${skillContent}`, 'utf8');
      console.log(`  ✓ [Windsurf] Adicionado a: ${destFile}`);
      break;

    case 'local':
    case '.':
      destDir = process.cwd();
      destFile = path.join(destDir, 'SKILL.md');
      fs.writeFileSync(destFile, skillContent, 'utf8');
      if (fs.existsSync(REFERENCES_SOURCE)) {
        copyDirectorySync(REFERENCES_SOURCE, path.join(destDir, 'references'));
      }
      console.log(`  ✓ [Local] SKILL.md e references/ salvos em: ${destDir}`);
      break;

    default:
      console.warn(`  ⚠ Destino desconhecido ignorado: ${target}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] ? args[0].toLowerCase() : 'install';

  if (command === 'info' || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'print') {
    if (fs.existsSync(SKILL_SOURCE)) {
      process.stdout.write(fs.readFileSync(SKILL_SOURCE, 'utf8'));
    } else {
      console.error('Error: SKILL.md not found.');
    }
    return;
  }

  let targets = [];

  if (command === 'install') {
    const rawTargets = args.slice(1);
    if (rawTargets.length > 0) {
      targets = rawTargets.flatMap(t => t.toLowerCase() === 'all' ? TARGET_OPTIONS.map(o => o.value) : t.split(/[\s,]+/));
    }
  } else if (TARGET_OPTIONS.some(o => o.value === command) || command === 'all') {
    targets = command === 'all' ? TARGET_OPTIONS.map(o => o.value) : [command];
  }

  if (targets.length === 0) {
    const response = await prompts(
      {
        type: 'multiselect',
        name: 'selected',
        message: 'Em quais IAs você deseja instalar a OmniCreator?',
        choices: TARGET_OPTIONS,
        hint: '- Espaço para marcar/desmarcar. Enter para confirmar',
        instructions: false
      },
      {
        onCancel: () => {
          console.log('\nInstalação cancelada pelo usuário.');
          process.exit(0);
        }
      }
    );

    targets = response.selected || [];
    if (targets.length === 0) {
      console.log('Nenhuma IA selecionada. Usando Antigravity como padrão.');
      targets = ['antigravity'];
    }
  }

  console.log('\n🚀 Instalando OmniCreator...');
  for (const target of targets) {
    installToTarget(target);
  }
  console.log('\n✨ Concluído com sucesso! Use /creator:voice ou /creator:matrix para começar.\n');
}

main().catch(err => {
  console.error('Erro na execução do OmniCreator:', err);
  process.exit(1);
});
