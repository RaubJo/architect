;(() => {
    const version = location.pathname.match(/\/(v[^/]+)(?:\/|$)/)?.[1] ?? "Latest"

    const addVersionFooter = () => {
        const main = document.querySelector(".content main")

        if (!main || main.querySelector(".artisan-version-footer")) {
            return
        }

        const footer = document.createElement("footer")
        footer.className = "artisan-version-footer"
        footer.textContent = `Version: ${version}`
        main.append(footer)
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", addVersionFooter, { once: true })
    } else {
        addVersionFooter()
    }
})()
