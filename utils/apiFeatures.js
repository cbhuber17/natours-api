class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // ------------------------------------------------------------------

  filter() {
    const queryObj = { ...this.queryString };

    // However not all fields are used to filter, remove those ones
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering for >=, <, inequality methods
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // Regex a bunch of OR operators, /b match exactly, g multiple times

    // Get the tours that match the query object
    // Don't await here, need to chain other future methods like sorting, etc.
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  // ------------------------------------------------------------------

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // ------------------------------------------------------------------

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Default fields
      this.query = this.query.select('-__v'); // Everything except the V field
    }
    return this;
  }

  // ------------------------------------------------------------------

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit; // Number of tours to skip returning

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
