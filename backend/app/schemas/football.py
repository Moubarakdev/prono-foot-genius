from typing import List, Optional
from pydantic import BaseModel, Field


class TeamBase(BaseModel):
    id: int
    name: str
    logo: str


class VenueBase(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    city: Optional[str] = None


class TeamSearchResult(BaseModel):
    team: TeamBase
    venue: Optional[VenueBase] = None


class LeagueBase(BaseModel):
    id: int
    name: str
    type: str
    logo: str


class CountryBase(BaseModel):
    name: str
    code: Optional[str] = None
    flag: Optional[str] = None


class LeagueSearchResult(BaseModel):
    league: LeagueBase
    country: CountryBase


class FixtureBase(BaseModel):
    id: int
    timezone: str
    date: str
    timestamp: int


class FixtureTeams(BaseModel):
    home: TeamBase
    away: TeamBase


class FixtureResult(BaseModel):
    fixture: FixtureBase
    league: LeagueBase
    teams: FixtureTeams
    goals: dict
    score: dict
