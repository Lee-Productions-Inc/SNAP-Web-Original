const universityInput =
    document.getElementById("university");
const suggestionsBox =
    document.getElementById("university-suggestions");

if (universityInput && suggestionsBox) {
    let universities = [];

    function hideSuggestions() {
        suggestionsBox.replaceChildren();
        suggestionsBox.style.display = "none";
    }

    function showSuggestions(value) {
        hideSuggestions();

        const search = value.trim().toLocaleLowerCase();
        if (!search) return;

        const matches = universities
            .filter(university =>
                university.toLocaleLowerCase().startsWith(search)
            )
            .slice(0, 8);

        if (!matches.length) return;

        for (const university of matches) {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "university-option";
            option.textContent = university;
            option.setAttribute("role", "option");

            option.addEventListener("click", () => {
                universityInput.value = university;
                hideSuggestions();
                universityInput.dispatchEvent(
                    new Event("input", { bubbles: true })
                );
                universityInput.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
            });

            suggestionsBox.appendChild(option);
        }

        suggestionsBox.style.display = "block";
    }

    universityInput.addEventListener("input", () => {
        showSuggestions(universityInput.value);
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".university-autocomplete")) {
            hideSuggestions();
        }
    });

    fetch("../../functions/register/universities-ph.json")
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    `University list request failed (${response.status}).`
                );
            }

            return response.json();
        })
        .then(data => {
            if (!Array.isArray(data)) {
                throw new TypeError(
                    "University list must be a JSON array."
                );
            }

            universities = data.filter(
                university => typeof university === "string"
            );
        })
        .catch(error => {
            console.error("University autocomplete could not load:", error);
        });
}
