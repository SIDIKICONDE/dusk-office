plugins {
    id("org.jetbrains.intellij.platform") version "2.5.0"
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

intellijPlatform {
    pluginConfiguration {
        name = "Dusk Office Themes"
        version = providers.gradleProperty("pluginVersion")
        ideaVersion {
            sinceBuild = providers.gradleProperty("pluginSinceBuild")
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
    patchPluginXml {
        sinceBuild.set(providers.gradleProperty("pluginSinceBuild"))
        val until = providers.gradleProperty("pluginUntilBuild")
        untilBuild.set(until.map { v -> v.trim().ifEmpty { null } })
    }

    buildPlugin {
        dependsOn("patchPluginXml")
    }
}
