const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const baseCandidates = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'docs', 'package-candidates.json'), 'utf8')
);
const verification = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'docs', 'winget-verification-report.json'), 'utf8')
);
const expansionVerification = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'docs', 'winget-expansion-verification.json'), 'utf8')
);
const expansionCandidates = expansionVerification.valid.map(({ name, pkg, category }) => ({
  name,
  pkg,
  category
}));
const candidates = [...baseCandidates, ...expansionCandidates];

const verifiedPackages = new Set(verification.valid.map((item) => item.pkg));
const unverified = baseCandidates.filter((item) => !verifiedPackages.has(item.pkg));
if (unverified.length) {
  throw new Error(`Catalog contains unverified packages: ${unverified.map((item) => item.pkg).join(', ')}`);
}

const categories = [
  { id: 'ide-code', name: 'IDE & Code', icon: 'ph-code' },
  { id: 'languages-runtime', name: 'Languages & Runtime', icon: 'ph-brackets-curly' },
  { id: 'build-package', name: 'Build & Package', icon: 'ph-package' },
  { id: 'terminal-git', name: 'Terminal & Git', icon: 'ph-terminal-window' },
  { id: 'cli', name: 'CLI', icon: 'ph-terminal' },
  { id: 'devops-cloud', name: 'DevOps & Cloud', icon: 'ph-cloud' },
  { id: 'database-api', name: 'Database & API', icon: 'ph-database' },
  { id: 'ai-code', name: 'AI Coding', icon: 'ph-sparkle' },
  { id: 'network-security', name: 'Network & Security', icon: 'ph-shield-check' },
  { id: 'office-work', name: 'Office & Work', icon: 'ph-briefcase' },
  { id: 'communication-social', name: 'Communication & Social', icon: 'ph-chats-circle' },
  { id: 'browser', name: 'Browsers', icon: 'ph-browser' },
  { id: 'utilities', name: 'Utilities', icon: 'ph-toolbox' },
  { id: 'design-media', name: 'Design & Media', icon: 'ph-paint-brush' },
  { id: 'game-dev', name: 'Game & Game Dev', icon: 'ph-game-controller' }
];

const categoryAliases = {
  'Languages & Runtime': 'languages-runtime',
  'AI Coding': 'ai-code',
  'Network & Security': 'network-security',
  'Office & Work': 'office-work',
  'Communication & Social': 'communication-social',
  'Browsers': 'browser',
  'Utilities': 'utilities',
  'Design & Media': 'design-media'
};
const categoryByName = new Map(categories.flatMap((category) => [[category.name, category]]));
Object.entries(categoryAliases).forEach(([legacyName, id]) => {
  const category = categories.find((item) => item.id === id);
  if (category) categoryByName.set(legacyName, category);
});

const tags = [
  { id: 'code', label: 'Code', icon: 'ph-code' },
  { id: 'ide', label: 'IDE', icon: 'ph-app-window' },
  { id: 'cli', label: 'CLI', icon: 'ph-terminal' },
  { id: 'language', label: 'Language', icon: 'ph-brackets-curly' },
  { id: 'runtime', label: 'Runtime', icon: 'ph-cpu' },
  { id: 'git', label: 'Git', icon: 'ph-git-branch' },
  { id: 'package-manager', label: 'Package', icon: 'ph-package' },
  { id: 'devops', label: 'DevOps', icon: 'ph-infinity' },
  { id: 'cloud', label: 'Cloud', icon: 'ph-cloud' },
  { id: 'container', label: 'Container', icon: 'ph-cube' },
  { id: 'database', label: 'Database', icon: 'ph-database' },
  { id: 'api', label: 'API', icon: 'ph-plugs-connected' },
  { id: 'ai', label: 'AI', icon: 'ph-sparkle' },
  { id: 'network', label: 'Network', icon: 'ph-globe' },
  { id: 'vpn', label: 'VPN', icon: 'ph-lock-key' },
  { id: 'security', label: 'Security', icon: 'ph-shield-check' },
  { id: 'remote', label: 'Remote', icon: 'ph-monitor-arrow-up' },
  { id: 'office', label: 'Office', icon: 'ph-briefcase' },
  { id: 'productivity', label: 'Productivity', icon: 'ph-check-square' },
  { id: 'social', label: 'Social', icon: 'ph-chats-circle' },
  { id: 'browser', label: 'Browser', icon: 'ph-browser' },
  { id: 'utility', label: 'Utility', icon: 'ph-toolbox' },
  { id: 'design', label: 'Design', icon: 'ph-paint-brush' },
  { id: 'media', label: 'Media', icon: 'ph-play-circle' },
  { id: 'game', label: 'Game', icon: 'ph-game-controller' },
  { id: 'mobile', label: 'Mobile', icon: 'ph-device-mobile' },
  { id: 'data', label: 'Data', icon: 'ph-chart-bar' },
  { id: 'javascript', label: 'JavaScript', icon: 'ph-file-js' },
  { id: 'python', label: 'Python', icon: 'ph-file-py' },
  { id: 'dotnet', label: '.NET', icon: 'ph-code-block' },
  { id: 'java', label: 'Java', icon: 'ph-coffee' },
  { id: 'go', label: 'Go', icon: 'ph-gauge' },
  { id: 'rust', label: 'Rust', icon: 'ph-gear' },
  { id: 'cpp', label: 'C/C++', icon: 'ph-file-cpp' },
  { id: 'kubernetes', label: 'Kubernetes', icon: 'ph-hexagon' }
];

const existingIDs = {
  'Discord.Discord': 'discord',
  'SlackTechnologies.Slack': 'slack',
  'Microsoft.Teams': 'teams',
  'Telegram.TelegramDesktop': 'telegram',
  'Google.Chrome': 'chrome',
  'Google.GoogleDrive': 'drive',
  'Mozilla.Firefox': 'firefox',
  'Microsoft.VisualStudioCode': 'vscode',
  'OpenAI.Codex': 'codex',
  'Anysphere.Cursor': 'cursor',
  'Git.Git': 'git',
  'OpenJS.NodeJS.LTS': 'node',
  'Python.Python.3.13': 'python',
  'Docker.DockerDesktop': 'docker',
  'Valve.Steam': 'steam',
  'EpicGames.EpicGamesLauncher': 'epic',
  'Blizzard.BattleNet': 'bnet',
  'RiotGames.Valorant.AP': 'valorant',
  '7zip.7zip': 'sevenzip',
  'Microsoft.PowerToys': 'powertoys',
  'voidtools.Everything': 'everything',
  'VideoLAN.VLC': 'vlc',
  'Figma.Figma': 'figma',
  'BlenderFoundation.Blender': 'blender',
  'Notion.Notion': 'notion'
};

const publisherPrefixes = {
  Microsoft: 'Microsoft',
  JetBrains: 'JetBrains',
  Google: 'Google',
  GitHub: 'GitHub',
  Hashicorp: 'HashiCorp',
  Kubernetes: 'Kubernetes',
  Cloudflare: 'Cloudflare',
  Oracle: 'Oracle',
  PostgreSQL: 'PostgreSQL',
  MongoDB: 'MongoDB',
  Adobe: 'Adobe',
  OpenAI: 'OpenAI',
  Docker: 'Docker',
  Mozilla: 'Mozilla',
  Brave: 'Brave',
  Valve: 'Valve',
  EpicGames: 'Epic Games',
  Blizzard: 'Blizzard Entertainment',
  RiotGames: 'Riot Games',
  EclipseAdoptium: 'Eclipse Adoptium',
  Python: 'Python Software Foundation',
  GoLang: 'The Go Authors',
  Rustlang: 'Rust Project',
  Ollama: 'Ollama',
  Figma: 'Figma',
  BlenderFoundation: 'Blender Foundation',
  GIMP: 'GIMP Team',
  Inkscape: 'Inkscape',
  KDE: 'KDE',
  Unity: 'Unity Technologies'
};

Object.assign(publisherPrefixes, {
  ExpressVPN: 'ExpressVPN',
  Privax: 'Privax',
  Surfshark: 'Surfshark',
  PrivateInternetAccess: 'Private Internet Access',
  CyberGhost: 'CyberGhost',
  IPVanish: 'IPVanish',
  TunnelBear: 'TunnelBear',
  eVenture: 'eVenture',
  KeepSolid: 'KeepSolid',
  AdGuard: 'AdGuard'
});

const defaultDescriptions = {
  'IDE & Code': (name) => `${name} helps you write, review, debug, and manage source code.`,
  'Languages & Runtime': (name) => `${name} provides an SDK or runtime for building and running projects.`,
  'Build & Package': (name) => `${name} supports builds, dependencies, or toolchain version management.`,
  'Terminal & Git': (name) => `${name} supports terminal, Git, or source-control workflows.`,
  CLI: (name) => `${name} is a command-line utility for daily development work.`,
  'DevOps & Cloud': (name) => `${name} supports containers, cloud platforms, or infrastructure automation.`,
  'Database & API': (name) => `${name} helps you work with databases or test APIs.`,
  'AI Coding': (name) => `${name} supports AI-assisted coding or local model workflows.`,
  'Network & Security': (name) => `${name} supports networking, security, VPN, or remote access.`,
  'Office & Work': (name) => `${name} supports documents, collaboration, and office work.`,
  'Communication & Social': (name) => `${name} is used for messaging, meetings, or team coordination.`,
  'Browsers': (name) => `${name} is a browser for work, development, and web testing.`,
  'Utilities': (name) => `${name} is a Windows utility for everyday workflows.`,
  'Design & Media': (name) => `${name} supports design, content creation, or media processing.`,
  'Game & Game Dev': (name) => `${name} is a game platform or game development tool.`
};

const descriptionOverrides = {
  'Microsoft.VisualStudioCode': 'A lightweight code editor with a deep extension ecosystem and integrated terminal.',
  'Microsoft.VisualStudio.2022.Community': 'A full Windows IDE for .NET, C++, desktop, web, and cloud projects.',
  'JetBrains.Toolbox': 'Centralized install and update management for JetBrains IDEs.',
  'Google.AndroidStudio': 'The official IDE for building, debugging, and packaging Android apps.',
  'Anysphere.Cursor': 'An AI-native code editor with project-aware assistance.',
  'Codeium.Windsurf': 'An AI-powered IDE for editing and navigating large codebases.',
  'OpenJS.NodeJS.LTS': 'A stable JavaScript runtime for web, backend, and build tooling.',
  'Python.Python.3.14': 'Python 3.14 for automation, backend services, data work, and AI.',
  'GoLang.Go': 'The official Go toolchain with compiler, formatter, tests, and module tooling.',
  'Rustlang.Rustup': 'The Rust toolchain manager for Cargo, compilers, and build targets.',
  'Microsoft.DotNet.SDK.10': '.NET SDK 10 for web, API, desktop, cloud, and tooling.',
  'EclipseAdoptium.Temurin.21.JDK': 'OpenJDK 21 LTS from Eclipse Adoptium for Java and Kotlin.',
  'pnpm.pnpm': 'A space-efficient Node.js package manager with strong workspace support.',
  'astral-sh.uv': 'A fast Python package and environment manager from Astral.',
  'Microsoft.WindowsTerminal': 'A modern terminal for PowerShell, Command Prompt, WSL, and SSH.',
  'Git.Git': 'The foundational version-control tool for most software projects.',
  'GitHub.cli': 'Work with repositories, issues, pull requests, and GitHub workflows from the terminal.',
  'Docker.DockerDesktop': 'Run containers, Docker Compose, and local Kubernetes on Windows.',
  'Microsoft.WSL': 'Run integrated Linux environments directly inside Windows.',
  'Kubernetes.kubectl': 'The official CLI for managing Kubernetes clusters and workloads.',
  'Hashicorp.Terraform': 'Infrastructure as Code for managing cloud and platform resources.',
  'Postman.Postman': 'Design, send, test, and document HTTP APIs.',
  'Bruno.Bruno': 'A Git-friendly API client that stores collections as files and works offline.',
  'DBeaver.DBeaver.Community': 'A cross-platform database client for SQL and many database engines.',
  'Microsoft.SQLServerManagementStudio': 'Administer, query, and debug SQL Server instances.',
  'WiresharkFoundation.Wireshark': 'Analyze packets and diagnose network traffic.',
  'Bitwarden.Bitwarden': 'Cross-platform password and credential management.',
  'Microsoft.Office': 'Microsoft 365 Apps for documents, spreadsheets, and presentations.',
  'Notion.Notion': 'Notes, docs, wikis, and team project tracking.',
  'Obsidian.Obsidian': 'Local Markdown notes with backlinks and an extensible plugin system.',
  'Google.Chrome': 'A Chromium browser for daily work and web development.',
  'Mozilla.Firefox': 'An open-source browser and Gecko testing target.',
  'Microsoft.PowerToys': 'Advanced Windows utilities for windows, keyboard, files, and automation.',
  'voidtools.Everything': 'Near-instant file search by name on Windows.',
  'OpenAI.Codex': 'A terminal coding assistant that works directly inside your codebase.',
  'Ollama.Ollama': 'Download and run local language models through CLI and API workflows.',
  'ElementLabs.LMStudio': 'A desktop interface for downloading, running, and serving local AI models.',
  'Figma.Figma': 'Interface design, prototyping, and product collaboration.',
  'BlenderFoundation.Blender': 'A 3D suite for modeling, animation, rendering, and compositing.',
  'GodotEngine.GodotEngine': 'An open-source game engine for 2D and 3D games.',
  'Unity.UnityHub': 'Manage Unity Editor versions, projects, and build modules.'
};

const largePackages = new Set([
  'Microsoft.VisualStudio.2022.Community',
  'Google.AndroidStudio',
  'Docker.DockerDesktop',
  'SUSE.RancherDesktop',
  'Oracle.VirtualBox',
  'Microsoft.SQLServer.2022.Developer',
  'Microsoft.SQLServerManagementStudio',
  'Microsoft.Office',
  'Microsoft.PowerBI',
  'ElementLabs.LMStudio',
  'BlenderFoundation.Blender',
  'Unity.UnityHub',
  'Valve.Steam',
  'EpicGames.EpicGamesLauncher',
  'Blizzard.BattleNet',
  'RiotGames.Valorant.AP',
  'Microsoft.VisualStudio.2022.Professional',
  'Microsoft.VisualStudio.2022.Enterprise',
  'Microsoft.VisualStudio.2022.BuildTools',
  'JetBrains.CLion',
  'JetBrains.GoLand',
  'JetBrains.PhpStorm',
  'JetBrains.RubyMine',
  'JetBrains.RustRover',
  'Neo4j.Neo4jDesktop',
  'MongoDB.Server',
  'Oracle.MySQL',
  'MariaDB.Server',
  'Adobe.CreativeCloud',
  'KDE.Kdenlive',
  'Meltytech.Shotcut',
  'OpenShot.OpenShot',
  'GOG.Galaxy',
  'ElectronicArts.EADesktop',
  'Ubisoft.Connect',
  'HeroicGamesLauncher.HeroicGamesLauncher',
  'Overwolf.CurseForge',
  'Mojang.MinecraftLauncher',
  'Roblox.Roblox',
  'YoYoGames.GameMaker.Studio.2',
  'Google.PlayGames.Beta',
  'nomic.gpt4all',
  'AMD.LemonadeServer',
  'AhoyLabs.BackyardAI',
  'CloudStack.Msty',
  'CloudStack.Msty.CPU'
]);

const privilegedPackages = new Set([
  'Docker.DockerDesktop',
  'RedHat.Podman-Desktop',
  'SUSE.RancherDesktop',
  'Microsoft.WSL',
  'Oracle.VirtualBox',
  'Hashicorp.Vagrant',
  'WiresharkFoundation.Wireshark',
  'OpenVPNTechnologies.OpenVPNConnect',
  'Cloudflare.Warp',
  'Tailscale.Tailscale',
  'WireGuard.WireGuard',
  'NordSecurity.NordVPN',
  'Proton.ProtonVPN',
  'MullvadVPN.MullvadVPN',
  'Windscribe.Windscribe',
  'ExpressVPN.ExpressVPN',
  'Privax.HMAVPN',
  'Surfshark.Surfshark',
  'PrivateInternetAccess.PrivateInternetAccess',
  'CyberGhost.CyberGhost',
  'IPVanish.IPVanish',
  'TunnelBear.TunnelBear',
  'eVenture.HideMe',
  'KeepSolid.VPNUnlimited',
  'AdGuard.AdGuardVPN',
  'Microsoft.SQLServer.2022.Developer',
  'Rufus.Rufus'
]);

const commercialPackages = new Set([
  'JetBrains.WebStorm',
  'JetBrains.Rider',
  'JetBrains.DataGrip',
  'Axosoft.GitKraken',
  'TablePlus.TablePlus',
  'AgileBits.1Password',
  'Microsoft.Office',
  'Miro.Miro',
  'JetBrains.CLion',
  'JetBrains.GoLand',
  'JetBrains.PhpStorm',
  'JetBrains.RubyMine',
  'JetBrains.RustRover',
  'Microsoft.VisualStudio.2022.Professional',
  'Microsoft.VisualStudio.2022.Enterprise',
  'ScooterSoftware.BeyondCompare.5',
  'GPSoftware.DirectoryOpus',
  'Typora.Typora',
  'Corel.MindManager',
  'Adobe.CreativeCloud',
  'NordSecurity.NordVPN',
  'Proton.ProtonVPN',
  'MullvadVPN.MullvadVPN',
  'Windscribe.Windscribe',
  'ExpressVPN.ExpressVPN',
  'Privax.HMAVPN',
  'Surfshark.Surfshark',
  'PrivateInternetAccess.PrivateInternetAccess',
  'CyberGhost.CyberGhost',
  'IPVanish.IPVanish',
  'TunnelBear.TunnelBear',
  'eVenture.HideMe',
  'KeepSolid.VPNUnlimited',
  'AdGuard.AdGuardVPN'
]);

const loginPackages = new Set([
  'GitHub.GitHubDesktop',
  'Axosoft.GitKraken',
  'Anysphere.Cursor',
  'Codeium.Windsurf',
  'SlackTechnologies.Slack',
  'Microsoft.Teams',
  'Discord.Discord',
  'Telegram.TelegramDesktop',
  'OpenWhisperSystems.Signal',
  'Google.GoogleDrive',
  'Dropbox.Dropbox',
  'Microsoft.OneDrive',
  'Notion.Notion',
  'Doist.Todoist',
  'Zoom.Zoom',
  'Figma.Figma',
  'Valve.Steam',
  'EpicGames.EpicGamesLauncher',
  'Blizzard.BattleNet',
  'Spotify.Spotify',
  'Anthropic.Claude',
  'Anthropic.ClaudeCode',
  'GitHub.Copilot',
  'Perplexity.Perplexity',
  'Alibaba.Qoder',
  'GOG.Galaxy',
  'ElectronicArts.EADesktop',
  'Ubisoft.Connect',
  'Overwolf.CurseForge'
]);

const tagRules = [
  [/visualstudio|dotnet|rider|sqlserver/i, ['dotnet']],
  [/nodejs|pnpm|yarn|nvm|volta|denoland|bun/i, ['javascript']],
  [/python|pycharm|miniconda|astral-sh/i, ['python', 'data']],
  [/golang/i, ['go']],
  [/rustlang/i, ['rust']],
  [/temurin|intellij/i, ['java']],
  [/android|dart|arduino/i, ['mobile']],
  [/llvm|zig|cmake|ninja|meson/i, ['cpp']],
  [/github|gitkraken|sourcetree|tortoisegit|lazygit|git\.git/i, ['git']],
  [/docker|podman|rancher/i, ['container']],
  [/kubernetes|helm|k9s|minikube|mirantis|kind/i, ['kubernetes', 'container']],
  [/azure|amazon\.aws|google\.cloud|cloudflare|pulumi|terraform|opentofu|vault|packer/i, ['cloud']],
  [/postman|insomnia|bruno/i, ['api']],
  [/dbeaver|datagrip|mongodb|postgresql|mysql|redis|sqlserver|sqlite|tableplus|beekeeper/i, ['database']],
  [/wireshark|fiddler|mitmproxy|winscp|putty/i, ['network']],
  [/cloudflare\.warp|tailscale|wireguard|openvpn|zerotier|nordvpn|protonvpn|mullvadvpn|windscribe|expressvpn|hma vpn|hmavpn|surfshark|privateinternetaccess|private internet access|cyberghost|ipvanish|tunnelbear|hideme|hide\.me|vpn unlimited|vpnunlimited|adguardvpn|adguard vpn|\bvpn\b/i, ['network', 'vpn']],
  [/bitwarden|1password|keepass|gpg/i, ['security']],
  [/teamviewer|anydesk|localsend|syncthing/i, ['remote']],
  [/office|libreoffice|onlyoffice|powerbi|acrobat|draw|miro/i, ['office', 'productivity']],
  [/notion|obsidian|logseq|todoist/i, ['productivity']],
  [/teams|slack|discord|telegram|signal|zoom/i, ['social']],
  [/chrome|firefox|brave|vivaldi|opera|browsercompany|zen-team|torproject/i, ['browser']],
  [/powertoys|everything|sharex|greenshot|flameshot|rufus|windirstat|wiztree|crystaldisk|eartrumpet|sysinternals|quicklook|flow-launcher|autohotkey/i, ['utility']],
  [/figma|blender|gimp|inkscape|krita/i, ['design']],
  [/vlc|handbrake|obsproject|audacity|spotify/i, ['media']],
  [/godot|unity|steam|epicgames|blizzard|riotgames/i, ['game']]
];

const categoryTags = {
  'IDE & Code': ['code', 'ide'],
  'Languages & Runtime': ['code', 'language', 'runtime'],
  'Build & Package': ['code', 'package-manager', 'cli'],
  'Terminal & Git': ['code', 'git', 'cli'],
  CLI: ['code', 'cli', 'utility'],
  'DevOps & Cloud': ['code', 'devops', 'cloud'],
  'Database & API': ['code', 'database'],
  'AI Coding': ['code', 'ai'],
  'Network & Security': ['network', 'security'],
  'Office & Work': ['office', 'productivity'],
  'Communication & Social': ['social'],
  'Browsers': ['browser', 'network'],
  'Utilities': ['utility'],
  'Design & Media': ['design', 'media'],
  'Game & Game Dev': ['game']
};

const matchNameOverrides = {
  'Microsoft.VisualStudioCode': ['Microsoft Visual Studio Code', 'Visual Studio Code', 'VS Code'],
  'Microsoft.VisualStudio.2022.Community': ['Microsoft Visual Studio Community 2022', 'Visual Studio Community 2022'],
  'OpenJS.NodeJS.LTS': ['Node.js', 'Node.js LTS'],
  'Microsoft.DotNet.SDK.8': ['Microsoft .NET SDK 8', '.NET SDK 8'],
  'Microsoft.DotNet.SDK.10': ['Microsoft .NET SDK 10', '.NET SDK 10'],
  'Microsoft.WSL': ['Windows Subsystem for Linux', 'WSL'],
  'GitHub.cli': ['GitHub CLI', 'gh'],
  'Microsoft.SQLServerManagementStudio': ['SQL Server Management Studio', 'SSMS'],
  'Microsoft.SQLServer.2022.Developer': ['Microsoft SQL Server 2022', 'SQL Server 2022'],
  'DBeaver.DBeaver.Community': ['DBeaver', 'DBeaver Community'],
  'RedisInsight.RedisInsight': ['Redis Insight', 'RedisInsight'],
  '7zip.7zip': ['7-Zip'],
  'voidtools.Everything': ['Everything'],
  'OpenAI.Codex': ['Codex', 'Codex CLI']
};

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.net/gi, ' dotnet ')
    .replace(/\+\+/g, 'pp')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function appID(candidate, usedIDs) {
  const preferred = existingIDs[candidate.pkg] || slugify(candidate.name);
  let id = preferred;
  let suffix = 2;
  while (usedIDs.has(id)) {
    id = `${preferred}-${suffix}`;
    suffix += 1;
  }
  usedIDs.add(id);
  return id;
}

function publisherFor(packageID) {
  const prefix = packageID.split('.')[0];
  return publisherPrefixes[prefix]
    || prefix
      .replaceAll('-', ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function tagsFor(candidate) {
  const values = new Set(categoryTags[candidate.category] || []);
  const haystack = `${candidate.pkg} ${candidate.name}`;
  tagRules.forEach(([pattern, additions]) => {
    if (pattern.test(haystack)) additions.forEach((tag) => values.add(tag));
  });
  if (candidate.category === 'Database & API' && /postman|insomnia|bruno/i.test(haystack)) {
    values.delete('database');
    values.add('api');
  }
  return [...values];
}

function typeFor(candidate) {
  if (candidate.category === 'IDE & Code') return 'IDE / Editor';
  if (candidate.category === 'Languages & Runtime') return 'SDK / Runtime';
  if (candidate.category === 'Build & Package') return 'Build / Package';
  if (candidate.category === 'CLI') return 'CLI';
  if (candidate.category === 'Terminal & Git') return /terminal|powershell|nushell|wezterm|warp|ohmyposh/i.test(candidate.pkg)
    ? 'Terminal / Shell'
    : 'Git / Version control';
  if (candidate.category === 'DevOps & Cloud') return 'DevOps / Cloud';
  if (candidate.category === 'Database & API') return 'Database / API';
  return 'Desktop app';
}

function installOrderFor(candidate) {
  const order = {
    'Utilities': 10,
    'Terminal & Git': 20,
    CLI: 25,
    'Languages & Runtime': 30,
    'Build & Package': 40,
    'IDE & Code': 50,
    'DevOps & Cloud': 60,
    'Database & API': 70,
    'Network & Security': 75,
    'AI Coding': 80,
    'Browsers': 85,
    'Office & Work': 90,
    'Communication & Social': 92,
    'Design & Media': 95,
    'Game & Game Dev': 100
  };
  return order[candidate.category] || 80;
}

function riskFor(candidate) {
  const notes = [];
  if (largePackages.has(candidate.pkg)) {
    notes.push('Large download and may require significant disk space.');
  }
  if (privilegedPackages.has(candidate.pkg)) {
    notes.push('May require administrator rights, drivers, or a Windows restart.');
  } else if (commercialPackages.has(candidate.pkg)) {
    notes.push('May require an account or paid license.');
  } else if (loginPackages.has(candidate.pkg)) {
    notes.push('Requires sign-in or account setup after install.');
  } else if (['Languages & Runtime', 'Build & Package', 'CLI', 'Terminal & Git', 'DevOps & Cloud'].includes(candidate.category)) {
    notes.push('May update PATH; open a new terminal after install.');
  }
  return notes.join(' ') || 'No special notes.';
}

function logoFor(id) {
  const directory = path.join(projectRoot, 'frontend', 'assets', 'apps');
  for (const extension of ['svg', 'png', 'ico', 'webp']) {
    const filename = `${id}.${extension}`;
    if (fs.existsSync(path.join(directory, filename))) return filename;
  }
  return '';
}

const usedIDs = new Set();
const apps = candidates.map((candidate, index) => {
  const category = categoryByName.get(candidate.category);
  if (!category) throw new Error(`Unknown category: ${candidate.category}`);
  const id = appID(candidate, usedIDs);
  return {
    id,
    name: candidate.name,
    cat: category.name,
    categoryId: category.id,
    pkg: candidate.pkg,
    source: 'winget',
    publisher: publisherFor(candidate.pkg),
    type: typeFor(candidate),
    desc: descriptionOverrides[candidate.pkg] || defaultDescriptions[candidate.category](candidate.name),
    risk: riskFor(candidate),
    tags: tagsFor(candidate),
    matchNames: matchNameOverrides[candidate.pkg] || [candidate.name],
    size: largePackages.has(candidate.pkg) ? 'large' : 'standard',
    logo: logoFor(id),
    verified: true,
    installOrder: installOrderFor(candidate),
    order: index + 1
  };
});

const storeApps = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    cat: 'Communication & Social',
    categoryId: 'communication-social',
    pkg: '9NKSQGP7F2NH',
    source: 'msstore',
    publisher: 'WhatsApp',
    type: 'Desktop app',
    desc: 'Message and call with the Microsoft Store version of WhatsApp.',
    risk: 'Microsoft Store manages the install location. Sign-in is required after install.',
    tags: ['social'],
    matchNames: ['WhatsApp'],
    size: 'standard',
    logo: logoFor('whatsapp'),
    verified: true,
    installOrder: 92,
    order: apps.length + 1
  },
  {
    id: 'nvidia-app',
    name: 'NVIDIA App',
    cat: 'Utilities',
    categoryId: 'utilities',
    pkg: 'XP8CLZL93F5Z4P',
    source: 'msstore',
    publisher: 'NVIDIA',
    type: 'Desktop app',
    desc: 'Manage NVIDIA features, optimize games, and update drivers.',
    risk: 'Only relevant for machines with NVIDIA GPUs. Microsoft Store manages the install location.',
    tags: ['utility', 'game'],
    matchNames: ['NVIDIA App'],
    size: 'standard',
    logo: logoFor('nvidia-app'),
    verified: true,
    installOrder: 10,
    order: apps.length + 2
  }
];
apps.push(...storeApps);

const idByPackage = new Map(apps.map((app) => [app.pkg, app.id]));
const dependencyPackages = {
  'pnpm.pnpm': ['OpenJS.NodeJS.LTS'],
  'Yarn.Yarn': ['OpenJS.NodeJS.LTS'],
  'Microsoft.Azure.FunctionsCoreTools': ['OpenJS.NodeJS.LTS'],
  'Derailed.k9s': ['Kubernetes.kubectl'],
  'Helm.Helm': ['Kubernetes.kubectl'],
  'Kubernetes.minikube': ['Kubernetes.kubectl'],
  'Kubernetes.kind': ['Kubernetes.kubectl', 'Docker.DockerDesktop'],
  'Hashicorp.Vagrant': ['Oracle.VirtualBox'],
  'Microsoft.VisualStudio.2022.Community': ['Git.Git'],
  'JetBrains.Rider': ['Microsoft.DotNet.SDK.10'],
  'JetBrains.IntelliJIDEA.Community': ['EclipseAdoptium.Temurin.21.JDK'],
  'Google.AndroidStudio': ['EclipseAdoptium.Temurin.21.JDK'],
  'OpenAI.Codex': ['Git.Git'],
  'Docker.DockerDesktop': ['Microsoft.WSL'],
  'JetBrains.CLion': ['Kitware.CMake', 'LLVM.LLVM'],
  'JetBrains.GoLand': ['GoLang.Go'],
  'JetBrains.PhpStorm': ['PHP.PHP.8.4'],
  'JetBrains.RustRover': ['Rustlang.Rustup'],
  'Posit.RStudio': ['RProject.R'],
  'k3d.k3d': ['Kubernetes.kubectl', 'Docker.DockerDesktop'],
  'nektos.act': ['Docker.DockerDesktop'],
  'GodotEngine.GodotEngine.Mono': ['Microsoft.DotNet.SDK.8']
};
apps.forEach((app) => {
  app.requires = (dependencyPackages[app.pkg] || [])
    .map((packageID) => idByPackage.get(packageID))
    .filter(Boolean);
});

const planDefinitions = [
  {
    id: 'developer-core',
    name: 'Developer Core',
    icon: 'ph-code',
    desc: 'The shared foundation for most programming workflows.',
    packages: [
      'Git.Git', 'GitHub.cli', 'Microsoft.VisualStudioCode', 'Microsoft.WindowsTerminal',
      'Microsoft.PowerShell', 'Google.Chrome', '7zip.7zip', 'Microsoft.PowerToys',
      'voidtools.Everything', 'Bitwarden.Bitwarden', 'ShareX.ShareX'
    ]
  },
  {
    id: 'office-remote',
    name: 'Office & Remote Work',
    icon: 'ph-briefcase',
    desc: 'Documents, meetings, sync, collaboration, and remote access.',
    packages: [
      'Microsoft.Office', 'Microsoft.Teams', 'SlackTechnologies.Slack', 'Zoom.Zoom',
      'Notion.Notion', 'Obsidian.Obsidian', 'Doist.Todoist', 'Google.GoogleDrive',
      'Microsoft.OneDrive', 'Adobe.Acrobat.Reader.64-bit', 'JGraph.Draw',
      'Miro.Miro', 'Bitwarden.Bitwarden', 'Tailscale.Tailscale'
    ]
  },
  {
    id: 'web-frontend',
    name: 'Web Frontend',
    icon: 'ph-browser',
    desc: 'JavaScript, browser testing, APIs, containers, and design handoff.',
    packages: [
      'OpenJS.NodeJS.LTS', 'pnpm.pnpm', 'Git.Git', 'GitHub.cli',
      'Microsoft.VisualStudioCode', 'Google.Chrome', 'Mozilla.Firefox',
      'Postman.Postman', 'Docker.DockerDesktop', 'DBeaver.DBeaver.Community',
      'Figma.Figma'
    ]
  },
  {
    id: 'node-backend',
    name: 'Node.js Backend',
    icon: 'ph-brackets-curly',
    desc: 'Backend JavaScript with APIs, containers, and local databases.',
    packages: [
      'OpenJS.NodeJS.LTS', 'pnpm.pnpm', 'Git.Git', 'Microsoft.VisualStudioCode',
      'Docker.DockerDesktop', 'Postman.Postman', 'Bruno.Bruno',
      'DBeaver.DBeaver.Community', 'PostgreSQL.PostgreSQL.17',
      'RedisInsight.RedisInsight', 'MongoDB.Compass.Full'
    ]
  },
  {
    id: 'python-data-ai',
    name: 'Python, Data & AI',
    icon: 'ph-chart-bar',
    desc: 'Python, environments, data tooling, and local AI.',
    packages: [
      'Python.Python.3.14', 'astral-sh.uv', 'Anaconda.Miniconda3',
      'Microsoft.VisualStudioCode', 'Git.Git', 'Docker.DockerDesktop',
      'DBeaver.DBeaver.Community', 'Postman.Postman', 'Microsoft.PowerBI',
      'Ollama.Ollama', 'ElementLabs.LMStudio'
    ]
  },
  {
    id: 'dotnet',
    name: '.NET Developer',
    icon: 'ph-desktop-tower',
    desc: '.NET 10, Visual Studio, SQL Server, and API testing.',
    packages: [
      'Microsoft.VisualStudio.2022.Community', 'Microsoft.DotNet.SDK.10',
      'Git.Git', 'Microsoft.PowerShell', 'Microsoft.SQLServer.2022.Developer',
      'Microsoft.SQLServerManagementStudio', 'Docker.DockerDesktop', 'Postman.Postman'
    ]
  },
  {
    id: 'java',
    name: 'Java Developer',
    icon: 'ph-coffee',
    desc: 'Java 21 LTS, IntelliJ, containers, and databases.',
    packages: [
      'JetBrains.IntelliJIDEA.Community', 'EclipseAdoptium.Temurin.21.JDK',
      'Git.Git', 'Microsoft.WindowsTerminal', 'Docker.DockerDesktop',
      'Postman.Postman', 'DBeaver.DBeaver.Community', 'RedisInsight.RedisInsight'
    ]
  },
  {
    id: 'mobile',
    name: 'Mobile Developer',
    icon: 'ph-device-mobile',
    desc: 'Android, Dart, API testing, and product design.',
    packages: [
      'Google.AndroidStudio', 'EclipseAdoptium.Temurin.21.JDK', 'Google.DartSDK',
      'Microsoft.VisualStudioCode', 'Git.Git', 'Postman.Postman',
      'Docker.DockerDesktop', 'Figma.Figma', 'JGraph.Draw'
    ]
  },
  {
    id: 'systems',
    name: 'Go & Rust Systems',
    icon: 'ph-cpu',
    desc: 'Systems toolchains, compilers, and modern CLI utilities.',
    packages: [
      'GoLang.Go', 'Rustlang.Rustup', 'Microsoft.VisualStudioCode', 'Git.Git',
      'Kitware.CMake', 'LLVM.LLVM', 'Ninja-build.Ninja', 'Microsoft.PowerShell',
      'Docker.DockerDesktop', 'BurntSushi.ripgrep.MSVC', 'sharkdp.fd',
      'sharkdp.bat', 'junegunn.fzf', 'jqlang.jq', 'Casey.Just'
    ]
  },
  {
    id: 'devops-cloud',
    name: 'DevOps & Cloud',
    icon: 'ph-cloud',
    desc: 'WSL, containers, Kubernetes, IaC, and the major cloud CLIs.',
    packages: [
      'Microsoft.WSL', 'Docker.DockerDesktop', 'Microsoft.WindowsTerminal',
      'Microsoft.PowerShell', 'Git.Git', 'GitHub.cli', 'Microsoft.AzureCLI',
      'Amazon.AWSCLI', 'Google.CloudSDK', 'Kubernetes.kubectl', 'Helm.Helm',
      'Hashicorp.Terraform', 'OpenTofu.Tofu', 'Pulumi.Pulumi', 'Derailed.k9s',
      'Cloudflare.cloudflared', 'Hashicorp.Vault', 'WinSCP.WinSCP'
    ]
  },
  {
    id: 'database-api',
    name: 'Database & API',
    icon: 'ph-database',
    desc: 'API clients and database GUIs for many engines.',
    packages: [
      'Postman.Postman', 'Insomnia.Insomnia', 'Bruno.Bruno',
      'DBeaver.DBeaver.Community', 'JetBrains.DataGrip', 'MongoDB.Compass.Full',
      'PostgreSQL.pgAdmin', 'Oracle.MySQLWorkbench', 'RedisInsight.RedisInsight',
      'Microsoft.SQLServerManagementStudio', 'DBBrowserForSQLite.DBBrowserForSQLite',
      'TablePlus.TablePlus', 'beekeeper-studio.beekeeper-studio'
    ]
  },
  {
    id: 'product-design',
    name: 'Product & Design',
    icon: 'ph-paint-brush',
    desc: 'UI, 3D, images, video, audio, and product documentation.',
    packages: [
      'Figma.Figma', 'BlenderFoundation.Blender', 'GIMP.GIMP.3',
      'Inkscape.Inkscape', 'KDE.Krita', 'OBSProject.OBSStudio',
      'Audacity.Audacity', 'HandBrake.HandBrake', 'VideoLAN.VLC',
      'Notion.Notion', 'Miro.Miro', 'ShareX.ShareX'
    ]
  },
  {
    id: 'game-development',
    name: 'Game Development',
    icon: 'ph-game-controller',
    desc: 'Game engines, 3D tools, code, source control, and launchers.',
    packages: [
      'Unity.UnityHub', 'GodotEngine.GodotEngine', 'BlenderFoundation.Blender',
      'Microsoft.VisualStudioCode', 'Git.Git', 'Kitware.CMake',
      'Discord.Discord', 'Valve.Steam', 'EpicGames.EpicGamesLauncher'
    ]
  },
  {
    id: 'cpp-desktop',
    name: 'C/C++ Desktop',
    icon: 'ph-file-cpp',
    desc: 'Compilers, build systems, and IDEs for native Windows apps.',
    packages: [
      'Microsoft.VisualStudio.2022.Community', 'JetBrains.CLion',
      'Microsoft.VisualStudioCode', 'CodeBlocks.CodeBlocks', 'LLVM.LLVM',
      'Kitware.CMake', 'Ninja-build.Ninja', 'Git.Git'
    ]
  },
  {
    id: 'php-web',
    name: 'PHP Web',
    icon: 'ph-globe',
    desc: 'PHP, local web stack, databases, frontend tools, and API tooling.',
    packages: [
      'PHP.PHP.8.4', 'LeNgocKhoa.Laragon', 'JetBrains.PhpStorm',
      'Microsoft.VisualStudioCode', 'Git.Git', 'OpenJS.NodeJS.LTS',
      'MariaDB.Server', 'DBeaver.DBeaver.Community', 'Postman.Postman'
    ]
  },
  {
    id: 'qa-automation',
    name: 'QA & Automation',
    icon: 'ph-check-square',
    desc: 'Browsers, APIs, mobile, scripts, and containers for testing.',
    packages: [
      'Postman.Postman', 'Bruno.Bruno', 'Insomnia.Insomnia',
      'Google.Chrome', 'Mozilla.Firefox', 'Microsoft.Edge',
      'Python.Python.3.14', 'OpenJS.NodeJS.LTS', 'Google.AndroidStudio',
      'Docker.DockerDesktop', 'Git.Git'
    ]
  },
  {
    id: 'security-network',
    name: 'Security & Network',
    icon: 'ph-shield-check',
    desc: 'Network analysis, web security, VPN, encryption, and passwords.',
    packages: [
      'Insecure.Nmap', 'WiresharkFoundation.Wireshark',
      'PortSwigger.BurpSuite.Community', 'ZAP.ZAP', 'mitmproxy.mitmproxy',
      'WireGuard.WireGuard', 'Tailscale.Tailscale', 'IDRIX.VeraCrypt',
      'KeePassXCTeam.KeePassXC', 'Bitwarden.Bitwarden'
    ]
  },
  {
    id: 'sysadmin-support',
    name: 'Sysadmin & IT Support',
    icon: 'ph-monitor',
    desc: 'Windows administration, remote support, diagnostics, and USB boot tools.',
    packages: [
      'Microsoft.PowerShell', 'Microsoft.WindowsTerminal', 'Microsoft.WSL',
      'Microsoft.Sysinternals.Suite', 'PuTTY.PuTTY', 'WinSCP.WinSCP',
      'Insecure.Nmap', 'AnyDesk.AnyDesk', 'TeamViewer.TeamViewer',
      'WiresharkFoundation.Wireshark', 'Rufus.Rufus', 'Ventoy.Ventoy',
      'REALiX.HWiNFO', 'Wagnardsoft.DisplayDriverUninstaller'
    ]
  },
  {
    id: 'creator-streaming',
    name: 'Creator & Streaming',
    icon: 'ph-video-camera',
    desc: 'Recording, streaming, video editing, audio, images, and transcoding.',
    packages: [
      'OBSProject.OBSStudio', 'KDE.Kdenlive', 'Meltytech.Shotcut',
      'Audacity.Audacity', 'Gyan.FFmpeg', 'HandBrake.HandBrake',
      'VideoLAN.VLC', 'GIMP.GIMP.3', 'KDE.Krita', 'Canva.Canva',
      'NickeManarin.ScreenToGif'
    ]
  },
  {
    id: 'open-source-desktop',
    name: 'Open-source Desktop',
    icon: 'ph-github-logo',
    desc: 'Open-source desktop apps for everyday work.',
    packages: [
      'VSCodium.VSCodium', 'LibreWolf.LibreWolf', 'Mozilla.Thunderbird',
      'TheDocumentFoundation.LibreOffice', 'Joplin.Joplin',
      'KeePassXCTeam.KeePassXC', 'GIMP.GIMP.3', 'Inkscape.Inkscape',
      'VideoLAN.VLC', 'Giorgiotani.Peazip', 'hluk.CopyQ',
      'LocalSend.LocalSend', 'Syncthing.Syncthing'
    ]
  },
  {
    id: 'gaming-pc',
    name: 'Gaming PC',
    icon: 'ph-game-controller',
    desc: 'Launchers, game libraries, mods, chat, and media for a gaming PC.',
    packages: [
      'Valve.Steam', 'EpicGames.EpicGamesLauncher', 'GOG.Galaxy',
      'ElectronicArts.EADesktop', 'Ubisoft.Connect',
      'HeroicGamesLauncher.HeroicGamesLauncher', 'Playnite.Playnite',
      'PrismLauncher.PrismLauncher', 'Overwolf.CurseForge',
      'Discord.Discord', 'Spotify.Spotify'
    ]
  },
  {
    id: 'terminal-power-user',
    name: 'Terminal Power User',
    icon: 'ph-terminal-window',
    desc: 'Modern shells and fast CLI tools for daily work.',
    packages: [
      'Microsoft.WindowsTerminal', 'Microsoft.PowerShell', 'Nushell.Nushell',
      'Alacritty.Alacritty', 'wez.wezterm', 'JanDeDobbeleer.OhMyPosh',
      'Starship.Starship', 'Git.Git', 'GitHub.cli',
      'BurntSushi.ripgrep.MSVC', 'sharkdp.fd', 'sharkdp.bat',
      'junegunn.fzf', 'eza-community.eza', 'bootandy.dust',
      'Clement.bottom', 'jqlang.jq', 'MikeFarah.yq',
      'ajeetdsouza.zoxide', 'JesseDuffield.lazygit'
    ]
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    icon: 'ph-chart-bar',
    desc: 'Python, R, Julia, databases, BI, and spreadsheets.',
    packages: [
      'Python.Python.3.14', 'Anaconda.Miniconda3', 'RProject.R',
      'Posit.RStudio', 'Julialang.Julia', 'Microsoft.PowerBI',
      'DBeaver.DBeaver.Community', 'PostgreSQL.PostgreSQL.17',
      'Microsoft.Office', 'Microsoft.VisualStudioCode', 'Git.Git'
    ]
  },
  {
    id: 'ai-coding-local',
    name: 'AI Coding & Local LLM',
    icon: 'ph-sparkle',
    desc: 'AI coding CLIs, desktop chat, and local model runtimes.',
    packages: [
      'OpenAI.Codex', 'GitHub.Copilot', 'Anthropic.ClaudeCode',
      'Microsoft.AIShell', 'Ollama.Ollama', 'ElementLabs.LMStudio',
      'Jan.Jan', 'nomic.gpt4all', 'Bin-Huang.Chatbox',
      'CloudStack.Msty', 'Python.Python.3.14',
      'Microsoft.VisualStudioCode', 'Docker.DockerDesktop'
    ]
  }
];

const plans = planDefinitions.map((plan) => {
  const missing = plan.packages.filter((packageID) => !idByPackage.has(packageID));
  if (missing.length) throw new Error(`Plan ${plan.id} references missing packages: ${missing.join(', ')}`);
  return {
    id: plan.id,
    name: plan.name,
    icon: plan.icon,
    desc: plan.desc,
    apps: plan.packages.map((packageID) => idByPackage.get(packageID))
  };
});

function assertUnique(values, label) {
  const seen = new Set();
  const duplicates = new Set();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  if (duplicates.size) throw new Error(`${label} contains duplicates: ${[...duplicates].join(', ')}`);
}

assertUnique(categories.map((category) => category.id), 'Category IDs');
assertUnique(tags.map((tag) => tag.id), 'Tag IDs');
assertUnique(apps.map((app) => app.id), 'App IDs');
assertUnique(apps.map((app) => app.pkg.toLocaleLowerCase('en-US')), 'Package IDs');
assertUnique(plans.map((plan) => plan.id), 'Plan IDs');

const validCategoryIDs = new Set(categories.map((category) => category.id));
const validTagIDs = new Set(tags.map((tag) => tag.id));
const validAppIDs = new Set(apps.map((app) => app.id));
apps.forEach((app) => {
  if (!validCategoryIDs.has(app.categoryId)) throw new Error(`${app.id} has an unknown category: ${app.categoryId}`);
  const unknownTags = app.tags.filter((tag) => !validTagIDs.has(tag));
  if (unknownTags.length) throw new Error(`${app.id} has unknown tags: ${unknownTags.join(', ')}`);
  const unknownDependencies = app.requires.filter((id) => !validAppIDs.has(id));
  if (unknownDependencies.length) {
    throw new Error(`${app.id} has unknown dependencies: ${unknownDependencies.join(', ')}`);
  }
  if (!app.verified) throw new Error(`${app.pkg} is not verified`);
});
plans.forEach((plan) => {
  const unknownApps = plan.apps.filter((id) => !validAppIDs.has(id));
  if (unknownApps.length) throw new Error(`${plan.id} has unknown apps: ${unknownApps.join(', ')}`);
});
const expectedAppCount = candidates.length + storeApps.length;
if (apps.length !== expectedAppCount || apps.length < 400) {
  throw new Error(`Expected at least 400 apps and exactly ${expectedAppCount}, got ${apps.length}`);
}

const catalog = {
  schemaVersion: 3,
  verifiedAt: expansionVerification.verifiedAt,
  sources: {
    winget: 'Windows Package Manager community repository',
    msstore: 'Microsoft Store'
  },
  categories,
  tags,
  plans,
  apps
};

fs.writeFileSync(
  path.join(projectRoot, 'frontend', 'catalog.json'),
  `${JSON.stringify(catalog, null, 2)}\n`
);

const documentation = [
  '# SetupKit Verified App Catalog',
  '',
  `Verified at: ${catalog.verifiedAt}`,
  '',
  `Total: ${catalog.apps.length} apps (${apps.length - storeApps.length} winget + ${storeApps.length} Microsoft Store).`,
  '',
  'Every command uses `--exact`, a fixed source, package/source agreements, and non-interactive winget flags behind SetupKit confirmation dialogs.',
  ''
];

categories.forEach((category) => {
  documentation.push(`## ${category.name}`, '');
  documentation.push('| App | Publisher | Source | Package ID | Command |');
  documentation.push('|---|---|---|---|---|');
  catalog.apps
    .filter((app) => app.categoryId === category.id)
    .forEach((app) => {
      const silent = app.source === 'winget' ? ' --silent' : '';
      const command = `winget install --id ${app.pkg} --exact --source ${app.source}${silent} --accept-package-agreements --accept-source-agreements --disable-interactivity`;
      documentation.push(`| ${app.name} | ${app.publisher} | ${app.source} | \`${app.pkg}\` | \`${command}\` |`);
    });
  documentation.push('');
});

fs.writeFileSync(
  path.join(projectRoot, 'docs', 'CATALOG.md'),
  `${documentation.join('\n')}\n`
);

console.log(`Built catalog.json with ${catalog.apps.length} apps and ${catalog.plans.length} workstation plans.`);
