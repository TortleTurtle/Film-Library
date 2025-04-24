import {Movie} from "../modules/OMDb.ts";

export default function MovieList({movieList}: {movieList: Movie[]}) {

    return (<section>
        {movieList.map(movie => <article key={movie.imdbID}>
            <img src={movie.Poster} alt={`Poster for the movie ${movie.Title}`}/>
            <h2>{movie.Title}</h2>
            <ul>
                <li>{movie.Type}</li>
                <li>{movie.Year}</li>
            </ul>
        </article>)}
    </section>)
}