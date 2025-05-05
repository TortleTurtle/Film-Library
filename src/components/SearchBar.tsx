import {isMediaType, OMDbSearchParams, MEDIA_TYPES, SORT_BY, isSortBy} from "../modules/OMDb.ts";
import {ReactElement} from "react";

type SearchBarProps = {
    searchMovies: (movieSearchParams : OMDbSearchParams) => void,
    totalResults?: number,
    searchParams?: OMDbSearchParams
}

export default function SearchBar(props: SearchBarProps) {

    const paginationButtons : ReactElement[] = [];
    if (props.totalResults && props.searchParams) {
        const {searchParams} = props; //need to do this to narrow it further.
        const amountOfPages = Math.ceil(props.totalResults / 10);
        for (let i = 1; i <= amountOfPages; i++) {
            paginationButtons.push(
                <button key={i}
                        onClick={()=> props.searchMovies({...searchParams, page: i})}>
                    {i}
                </button>)
        }
    }

    // TODO: Graceful error handling, non-valid user input should not throw an error but display an message.
    function getSearchParametersFromFormData(formData : FormData){
        const formObject = Object.fromEntries(formData.entries());

        function isNotEmptyString(value: unknown): value is string {
            return typeof value === "string" && value.trim() !== "";
        }

        //validate title
        if (!isNotEmptyString(formObject.title)) {
            throw new Error("Title is required and must be a non-empty string");
        }
        const movieSearchParams : OMDbSearchParams = {
            title: formObject.title,
            order: "asc"
        }
        if (isNotEmptyString(formObject.mediaType)) {
            const parsedMediaType = formObject.mediaType.toLowerCase();
            if (!isMediaType(parsedMediaType)) throw new Error("Please select an option \"movie\", \"series\" or \"episode\"");

            movieSearchParams.mediaType = parsedMediaType;
        }
        if (isNotEmptyString(formObject.year)) {
            const yearAsNumber = Number(formObject.year);
            if (Number.isNaN(yearAsNumber)) throw new Error("Year may only contain digits 0-9");
            if (formObject.year.length != 4) throw new Error("Year must be 4 digits ex: \"2012\"");
            if (formObject.year.includes(".")) throw new Error("Year may not contain decimal points");
            if (yearAsNumber < 1878 || yearAsNumber > 2025) throw new Error("Year must be in range of 1878 - 2025");
            movieSearchParams.year = formObject.year;
        }

        if (isNotEmptyString(formObject.sortBy) && isSortBy(formObject.sortBy)) {
            movieSearchParams.sortBy = formObject.sortBy;
        }
        if (isNotEmptyString(formObject.order) && (formObject.order === "asc" || formObject.order === "desc")) {
            movieSearchParams.order = formObject.order;
        }

        props.searchMovies(movieSearchParams);
    }

    return (
        <section>
            <form action={getSearchParametersFromFormData}>
                <fieldset>
                    <legend>Basic search:</legend>
                    <label htmlFor="title">
                        Title
                        <input id="title" name="title" type="text" defaultValue="Batman"/>
                    </label>
                    <label htmlFor="type">
                        <select id="type" name="type" defaultValue="">
                            <option disabled value="">Select type</option>
                            {MEDIA_TYPES.map(type =>
                                <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                            )}
                        </select>
                    </label>
                    <label htmlFor="year">
                        Year
                        <input id="year" placeholder="ex: 2012" name="year" type="string"/>
                    </label>
                </fieldset>
                <fieldset>
                    <legend>Advanced Search</legend>
                    <label htmlFor="sortBy">Sort by:</label>
                    <select id="sortBy" name="sortBy" defaultValue="">
                        <option value="">None</option>
                        {SORT_BY.map(value =>
                            <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>
                        )}
                    </select>
                    <label htmlFor="order">Order by:</label>
                    <select id="order" name="order" defaultValue="asc">
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </fieldset>
                <button type="submit">Search Movie</button>
            </form>
            {paginationButtons}
        </section>
    )
}