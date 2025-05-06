import {
    isMediaType,
    OMDbSearchParams,
    MEDIA_TYPES,
    SORT_CATEGORIES,
    isSortCategory, SORT_DIRECTIONS, isSortDirection
} from "../modules/OMDb.ts";
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

    const getSearchParamFromProps = (paramKey : keyof OMDbSearchParams) => {
        const param = props.searchParams && props.searchParams[paramKey] ? props.searchParams[paramKey] : "";
        console.log(`${paramKey} : ${param}`);
        return param;
    }
    const renderSelectOptions = (paramKey : "mediaType" | "sortCategory" | "sortDirection", values : readonly string[]) => {
        return values.map(value => {
            if (value === getSearchParamFromProps(paramKey)) {
                return (<option key={value} value={value} selected>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)
            }
            return <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>
        });
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
            sortDirection: "ascending"
        }
        if (isNotEmptyString(formObject.mediaType)) {
            if (!isMediaType(formObject.mediaType)) throw new Error("Please select an option \"movie\", \"series\" or \"episode\"");

            movieSearchParams.mediaType = formObject.mediaType;
        }
        if (isNotEmptyString(formObject.year)) {
            const yearAsNumber = Number(formObject.year);
            if (Number.isNaN(yearAsNumber)) throw new Error("Year may only contain digits 0-9");
            if (formObject.year.length != 4) throw new Error("Year must be 4 digits ex: \"2012\"");
            if (formObject.year.includes(".")) throw new Error("Year may not contain decimal points");
            if (yearAsNumber < 1878 || yearAsNumber > 2025) throw new Error("Year must be in range of 1878 - 2025");
            movieSearchParams.year = formObject.year;
        }

        if (isNotEmptyString(formObject.sortCategory) && isSortCategory(formObject.sortCategory)) {
            movieSearchParams.sortCategory = formObject.sortCategory;
        }
        if (isNotEmptyString(formObject.sortDirection) && isSortDirection(formObject.sortDirection)) {
            movieSearchParams.sortDirection = formObject.sortDirection;
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
                        <input id="title" name="title" type="text" defaultValue={getSearchParamFromProps("title")}/>
                    </label>
                    <label htmlFor="mediaType">
                        <select id="mediaType" name="mediaType" defaultValue={getSearchParamFromProps("mediaType")}>
                            <option disabled value="">Select type</option>
                            {renderSelectOptions("mediaType", MEDIA_TYPES)}
                        </select>
                    </label>
                    <label htmlFor="year">
                        Year
                        <input id="year" name="year" type="string" defaultValue={getSearchParamFromProps("year")} placeholder="ex: 2012"/>
                    </label>
                </fieldset>
                <fieldset>
                    <legend>Advanced Search</legend>
                    <label htmlFor="sortCategory">Sort by:</label>
                    <select id="sortCategory" name="sortCategory" defaultValue={getSearchParamFromProps("sortCategory")}>
                        <option value="">None</option>
                        {renderSelectOptions("sortCategory", SORT_CATEGORIES)}
                    </select>
                    <label htmlFor="sortDirection">Direction:</label>
                    <select id="sortDirection" name="sortDirection" defaultValue={getSearchParamFromProps("sortDirection")}>
                        {renderSelectOptions("sortDirection", SORT_DIRECTIONS)}
                    </select>
                </fieldset>
                <button type="submit">Search Movie</button>
            </form>
            {paginationButtons}
        </section>
    )
}