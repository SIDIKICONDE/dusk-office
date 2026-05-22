plugins {
    id("org.jetbrains.intellij.platform") version "2.5.0"
    id("org.jlleitschuh.gradle.ktlint") version "14.2.0"
}

group = providers.gradleProperty("pluginGroup").get()
version = providers.gradleProperty("pluginVersion").get()

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    intellijPlatform {
        intellijIdeaCommunity(providers.gradleProperty("platformVersion"))
    }
}

ktlint {
    version.set("1.8.0")
}

intellijPlatform {
    pluginConfiguration {
        name = "Dusk Office Themes"
        version = providers.gradleProperty("pluginVersion")
        ideaVersion {
            sinceBuild = providers.gradleProperty("pluginSinceBuild")
            // Theme-only plugin: no internal API dependency,
            // forward-compatible with all future IntelliJ Platform builds.
            // Use a very high untilBuild so 2025.x / 2026.x / 2027.x install cleanly.
            untilBuild = "999.*"
        }
    }

    publishing {
        token = providers.environmentVariable("JETBRAINS_TOKEN")
    }
}

// Pas de code Java/Kotlin — uniquement ressources thème
tasks.matching { it.name == "compileJava" || it.name == "compileKotlin" }.configureEach {
    enabled = false
}

tasks {
    check {
        dependsOn("ktlintCheck")
    }

    patchPluginXml {
        sinceBuild.set(providers.gradleProperty("pluginSinceBuild"))
        val until = providers.gradleProperty("pluginUntilBuild")
        untilBuild.set(until.map { v -> v.trim().ifEmpty { null } })
    }

    buildPlugin {
        dependsOn("patchPluginXml")
    }
}
