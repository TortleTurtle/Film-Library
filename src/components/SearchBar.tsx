import {
    OMDbSearchParams,
    MEDIA_TYPES,
    SORT_CATEGORIES,
    SORT_DIRECTIONS, isMediaType, isSortCategory, isSortDirection
} from "../modules/OMDb.ts";
import {ChangeEvent, FormEvent, ReactElement, useState} from "react";
import {isNotEmptyString} from "../modules/utils.ts";

type SearchBarProps = {
    search: (searchParams : OMDbSearchParams) => void,
    getPage: (page : number) => void,
    totalResults?: number,
}

export default function SearchBar(props: SearchBarProps) {
    const [searchParams, setSearchParams] = useState<OMDbSearchParams>({
        title: "",
        sortDirection: "ascending"
    })

    const paginationButtons : ReactElement[] = [];
    if (props.totalResults) {
        const amountOfPages = Math.ceil(props.totalResults / 10);
        for (let i = 1; i <= amountOfPages; i++) {
            paginationButtons.push(
                <button key={i}
                        onClick={()=> props.getPage(i)}>
                    {i}
                </button>)
        }
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const [key, value] = [e.currentTarget.name, e.currentTarget.value];

        if (key === "title" || key === "year") {
            setSearchParams(prevState => { return {...prevState, [key]: value}})
        }
    }

    const renderSelectOptions = (values : readonly string[]) => {
         return values.map(value => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>);
    }
    const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const [key, value] = [e.currentTarget.name, e.currentTarget.value];

        const keyIsValid = key === "mediaType" || key === "sortCategory" || key === "sortDirection"
        const valueIsValid = {
            mediaType: () => {
                return value === "" || isMediaType(value);
            },
            sortCategory: () => {
                return value === "" || isSortCategory(value);
            },
            sortDirection: () => isSortDirection(value),
        }

        if (keyIsValid &&  valueIsValid[key]) {
            setSearchParams(prevState => {
                return {...prevState, [key]: value}
            });
        }
    }

    // TODO: Graceful error handling, non-valid user input should not throw an error but display an message.
    function handleFormSubmit(e : FormEvent){
        e.preventDefault();

        if (!isNotEmptyString(searchParams.title)) throw new Error("Title is required and must be a non-empty string");
        if (isNotEmptyString(searchParams.year)) {
            const yearAsNumber = Number(searchParams.year);
            if (Number.isNaN(yearAsNumber)) throw new Error("Year may only contain digits 0-9");
            if (searchParams.year.length != 4) throw new Error("Year must be 4 digits ex: \"2012\"");
            if (searchParams.year.includes(".")) throw new Error("Year may not contain decimal points");
            if (yearAsNumber < 1878 || yearAsNumber > 2025) throw new Error("Year must be in range of 1878 - 2025");
        }
        //Selects are validation when changed.

        props.search(searchParams);
    }

    return (
        <section>
            <form onSubmit={handleFormSubmit}>
                <fieldset>
                    <legend>Basic search:</legend>
                    <label htmlFor="title">
                        Title
                        <input id="title" name="title" type="text" value={searchParams.title} onChange={handleInputChange}/>
                    </label>
                    <label htmlFor="mediaType"> Select media type
                        <select id="mediaType" name="mediaType" value={searchParams.mediaType} onChange={handleSelectChange}>
                            <option value="">All</option>
                            {renderSelectOptions(MEDIA_TYPES)}
                        </select>
                    </label>
                    <label htmlFor="year"> Year
                        <input id="year" name="year" type="string" placeholder="ex: 2012" value={searchParams.year} onChange={handleInputChange} />
                    </label>
                </fieldset>
                <fieldset>
                    <legend>Advanced Search</legend>
                    <label htmlFor="sortCategory">Sort by:</label>
                    <select id="sortCategory" name="sortCategory" value={searchParams.sortCategory} onChange={handleSelectChange}>
                        <option value="">None</option>
                        {renderSelectOptions(SORT_CATEGORIES)}
                    </select>
                    <label htmlFor="sortDirection">Direction:</label>
                    <select id="sortDirection" name="sortDirection" value={searchParams.sortDirection} onChange={handleSelectChange}>
                        {renderSelectOptions(SORT_DIRECTIONS)}
                    </select>
                </fieldset>
                <button type="submit">Search Movie</button>
            </form>
            {paginationButtons}
        </section>
    )
}