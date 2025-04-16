import {isValidMediaType, MovieSearchParams, MEDIA_TYPES} from "../types/movieApiTypes.ts";

export default function SearchBar({searchMovies} : {searchMovies: (movieSearchParams : MovieSearchParams) => void}) {

    //Throwing errors in here as it is a helper function. Messages should be caught via try/catch.
    function getSearchParametersFromFormData(formData : FormData){
        const {title, mediaType, year} = Object.fromEntries(formData.entries());

        function isNotEmptyString(value: unknown): value is string {
            return typeof value === "string" && value.trim() !== "";
        }

        //validate title
        if (!isNotEmptyString(title)) {
            throw new Error("Title is required and must be a non-empty string");
        }
        const movieSearchParams : MovieSearchParams = {
            title: title,
        }

        if (isNotEmptyString(mediaType)) {
            const parsedMediaType = mediaType.toLowerCase();
            if (!isValidMediaType(parsedMediaType)) throw new Error("Please select an option \"movie\", \"series\" or \"episode\"");

            movieSearchParams.mediaType = parsedMediaType;
        }

        if (isNotEmptyString(year)) {
            const yearAsNumber = Number(year);
            if (isNaN(yearAsNumber)) throw new Error("Year may only contain digits 0-9");
            if (year.length != 4) throw new Error("Year must be 4 digits ex: \"2012\"");
            if (year.includes(".")) throw new Error("Year may not contain decimal points");
            if (yearAsNumber < 1878 || yearAsNumber > 2025) throw new Error("Year must be in range of 1878 - 2025");
            movieSearchParams.year = year;
        }

        searchMovies(movieSearchParams);
    }

    return (
        <section>
            <form action={getSearchParametersFromFormData}>
                <label htmlFor="title">
                    Title
                    <input id="title" name="title" type="text" defaultValue="Batman"/>
                </label>
                <label htmlFor="type">
                    <select id="type" name="type" defaultValue="">
                        <option disabled value="">Select type</option>
                        {MEDIA_TYPES.map((type) =>
                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        )}
                    </select>
                </label>
                <label htmlFor="year">
                    Year
                    <input id="year" placeholder="ex: 2012" name="year" type="string"/>
                </label>
                <button type="submit">Search Movie</button>
            </form>
        </section>
    )
}